/**
 * HealthPay Ledger V2 - Sprint 4
 * REST API Controllers
 * 
 * Backward-compatible REST endpoints alongside GraphQL
 */

import express, { Request, Response, Router } from 'express';
import { Pool } from 'pg';
import { MedCardCommandHandler } from '../commands/medcard-command-handler';
import { MedCardTier } from '../domain/medcard-aggregate';

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: any;
}

// -----------------------------------------------------------------------------
// MedCard REST Controller
// -----------------------------------------------------------------------------

export class MedCardRestController {
  private router: Router;

  constructor(
    private commandHandler: MedCardCommandHandler,
    private readDb: Pool
  ) {
    this.router = express.Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // GET endpoints
    this.router.get('/medcards/:id', this.getMedCard.bind(this));
    this.router.get('/medcards', this.listMedCards.bind(this));
    this.router.get('/medcards/:id/beneficiaries', this.getBeneficiaries.bind(this));
    this.router.get('/medcards/:id/claims/prescriptions', this.getPrescriptionClaims.bind(this));
    this.router.get('/medcards/:id/claims/insurance', this.getInsuranceClaims.bind(this));
    this.router.get('/medcards/:id/analytics', this.getAnalytics.bind(this));

    // POST endpoints
    this.router.post('/medcards', this.createMedCard.bind(this));
    this.router.post('/medcards/:id/activate', this.activateMedCard.bind(this));
    this.router.post('/medcards/:id/suspend', this.suspendMedCard.bind(this));
    this.router.post('/medcards/:id/close', this.closeMedCard.bind(this));
    this.router.post('/medcards/:id/beneficiaries', this.addBeneficiary.bind(this));
    this.router.post('/medcards/:id/claims/prescriptions', this.claimPrescription.bind(this));
    this.router.post('/medcards/:id/claims/insurance', this.fileInsuranceClaim.bind(this));
    this.router.post('/medcards/:id/upgrade', this.upgradeMedCard.bind(this));

    // PUT/PATCH endpoints
    this.router.put('/medcards/:id/limit', this.updateLimit.bind(this));

    // DELETE endpoints
    this.router.delete('/medcards/:id/beneficiaries/:beneficiaryId', this.removeBeneficiary.bind(this));
  }

  getRouter(): Router {
    return this.router;
  }

  // ---------------------------------------------------------------------------
  // GET Handlers
  // ---------------------------------------------------------------------------

  private async getMedCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.readDb.query(
        `SELECT 
          m.*,
          jsonb_agg(DISTINCT b.*) FILTER (WHERE b.id IS NOT NULL) as beneficiaries,
          jsonb_agg(DISTINCT pc.*) FILTER (WHERE pc.id IS NOT NULL) as prescription_claims,
          jsonb_agg(DISTINCT ic.*) FILTER (WHERE ic.id IS NOT NULL) as insurance_claims
        FROM medcards m
        LEFT JOIN beneficiaries b ON b.medcard_id = m.id
        LEFT JOIN prescription_claims pc ON pc.medcard_id = m.id
        LEFT JOIN insurance_claims ic ON ic.medcard_id = m.id
        WHERE m.id = $1
        GROUP BY m.id`,
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'MedCard not found' });
        return;
      }

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Error getting MedCard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async listMedCards(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, status, cardType } = req.query;

      let query = 'SELECT * FROM medcards WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      if (status) {
        query += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (cardType) {
        query += ` AND card_type = $${paramIndex}`;
        params.push(cardType);
        paramIndex++;
      }

      query += ' ORDER BY created_at DESC LIMIT 100';

      const result = await this.readDb.query(query, params);

      res.json({
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('Error listing MedCards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getBeneficiaries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.readDb.query(
        'SELECT * FROM beneficiaries WHERE medcard_id = $1 ORDER BY added_at DESC',
        [id]
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error('Error getting beneficiaries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getPrescriptionClaims(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await this.readDb.query(
        `SELECT pc.*, jsonb_agg(pi.*) as items
        FROM prescription_claims pc
        LEFT JOIN prescription_items pi ON pi.claim_id = pc.id
        WHERE pc.medcard_id = $1
        GROUP BY pc.id
        ORDER BY pc.claimed_at DESC
        LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      res.json({ data: result.rows });
    } catch (error) {
      console.error('Error getting prescription claims:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getInsuranceClaims(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0, status } = req.query;

      let query = `
        SELECT ic.*, jsonb_agg(cd.*) as documents
        FROM insurance_claims ic
        LEFT JOIN claim_documents cd ON cd.claim_id = ic.id
        WHERE ic.medcard_id = $1
      `;
      const params: any[] = [id];
      let paramIndex = 2;

      if (status) {
        query += ` AND ic.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ` GROUP BY ic.id ORDER BY ic.filed_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.readDb.query(query, params);

      res.json({ data: result.rows });
    } catch (error) {
      console.error('Error getting insurance claims:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = '';
      const params: any[] = [id];
      let paramIndex = 2;

      if (startDate && endDate) {
        dateFilter = `AND claimed_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        params.push(startDate, endDate);
      }

      const result = await this.readDb.query(
        `SELECT 
          COUNT(*) as total_claims,
          SUM(total_amount) as total_spent,
          SUM(covered_amount) as total_covered,
          SUM(copayment_amount) as total_copayments,
          AVG(total_amount) as average_claim_amount
        FROM prescription_claims 
        WHERE medcard_id = $1 ${dateFilter}`,
        params
      );

      res.json({ data: result.rows[0] });
    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ---------------------------------------------------------------------------
  // POST Handlers
  // ---------------------------------------------------------------------------

  private async createMedCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await this.commandHandler.handleCreateMedCard({
        userId: req.body.userId,
        cardType: req.body.cardType as MedCardTier,
        insuranceProvider: req.body.insuranceProvider,
        policyNumber: req.body.policyNumber,
        monthlyLimit: req.body.monthlyLimit,
        copaymentPercentage: req.body.copaymentPercentage,
        primaryHolder: req.body.primaryHolder,
        expiryDate: req.body.expiryDate,
        metadata: {
          userId: req.userId!,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        success: true,
        medCardId: result.medCardId,
        message: 'MedCard created successfully',
      });
    } catch (error) {
      console.error('Error creating MedCard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async activateMedCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleActivateMedCard({
        medCardId: id,
        activatedBy: req.userId!,
        reason: req.body.reason,
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'MedCard activated successfully',
      });
    } catch (error) {
      console.error('Error activating MedCard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async suspendMedCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleSuspendMedCard({
        medCardId: id,
        suspendedBy: req.userId!,
        reason: req.body.reason,
        notes: req.body.notes,
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'MedCard suspended successfully',
      });
    } catch (error) {
      console.error('Error suspending MedCard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async closeMedCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleCloseMedCard({
        medCardId: id,
        closedBy: req.userId!,
        reason: req.body.reason,
        refundAmount: req.body.refundAmount || 0,
        notes: req.body.notes,
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'MedCard closed successfully',
      });
    } catch (error) {
      console.error('Error closing MedCard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async addBeneficiary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleAddBeneficiary({
        medCardId: id,
        relationship: req.body.relationship,
        nationalId: req.body.nationalId,
        name: req.body.name,
        dateOfBirth: req.body.dateOfBirth,
        phoneNumber: req.body.phoneNumber,
        addedBy: req.userId!,
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Beneficiary added successfully',
      });
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async claimPrescription(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleClaimPrescription({
        medCardId: id,
        prescriptionId: req.body.prescriptionId,
        pharmacyId: req.body.pharmacyId,
        beneficiaryId: req.body.beneficiaryId,
        totalAmount: req.body.totalAmount,
        items: req.body.items,
        userId: req.userId!,
        pharmacyLocation: req.body.pharmacyLocation,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Prescription claimed successfully',
      });
    } catch (error) {
      console.error('Error claiming prescription:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async fileInsuranceClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleFileInsuranceClaim({
        medCardId: id,
        claimId: req.body.claimId || require('uuid').v4(),
        providerId: req.body.providerId,
        providerType: req.body.providerType,
        beneficiaryId: req.body.beneficiaryId,
        claimType: req.body.claimType,
        totalAmount: req.body.totalAmount,
        requestedCoverage: req.body.requestedCoverage,
        documents: req.body.documents,
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Insurance claim filed successfully',
      });
    } catch (error) {
      console.error('Error filing insurance claim:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private async upgradeMedCard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleUpgradeMedCard({
        medCardId: id,
        newTier: req.body.newTier as MedCardTier,
        newLimit: req.body.newLimit,
        newCopayment: req.body.newCopayment,
        effectiveDate: req.body.effectiveDate,
        upgradedBy: req.userId!,
        reason: req.body.reason,
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'MedCard upgraded successfully',
      });
    } catch (error) {
      console.error('Error upgrading MedCard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ---------------------------------------------------------------------------
  // PUT/PATCH Handlers
  // ---------------------------------------------------------------------------

  private async updateLimit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await this.commandHandler.handleUpdateLimit({
        medCardId: id,
        newLimit: req.body.newLimit,
        effectiveDate: req.body.effectiveDate,
        updatedBy: req.userId!,
        reason: req.body.reason,
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'Limit updated successfully',
      });
    } catch (error) {
      console.error('Error updating limit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ---------------------------------------------------------------------------
  // DELETE Handlers
  // ---------------------------------------------------------------------------

  private async removeBeneficiary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id, beneficiaryId } = req.params;

      const result = await this.commandHandler.handleRemoveBeneficiary({
        medCardId: id,
        beneficiaryId,
        removedBy: req.userId!,
        reason: req.body.reason || 'User request',
        userId: req.userId!,
      });

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({
        success: true,
        message: 'Beneficiary removed successfully',
      });
    } catch (error) {
      console.error('Error removing beneficiary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

export function createMedCardRestApi(
  commandHandler: MedCardCommandHandler,
  readDb: Pool
): Router {
  const controller = new MedCardRestController(commandHandler, readDb);
  return controller.getRouter();
}
