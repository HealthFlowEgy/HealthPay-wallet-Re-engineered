# Database Migration Guide

**Version**: 1.0.0  
**Date**: December 16, 2024  
**Status**: Production Ready

---

## 📋 Overview

This directory contains database migration tools and documentation for migrating HealthPay databases between environments. The migration package supports both MySQL and PostgreSQL databases.

### Supported Databases

| Database | Type | Purpose |
|----------|------|---------|
| **hpDB** | MySQL 8.0+ | Main application database |
| **hpLedger** | MySQL 8.0+ | Ledger database 1 |
| **hpLedger2** | MySQL 8.0+ | Ledger database 2 |
| **hpLedger3** | MySQL 8.0+ | Ledger database 3 |
| **hpLedgerRenewed** | MySQL 8.0+ | Renewed ledger database |
| **healthpay** | PostgreSQL 11+ | PostgreSQL database |

---

## 🔐 Security Notice

⚠️ **IMPORTANT**: Database credentials are stored in `DATABASE_CREDENTIALS.txt` for reference only. 

**Production Best Practices**:
- Never commit actual database dumps to version control
- Store credentials in secure vaults (HashiCorp Vault, AWS Secrets Manager)
- Use environment variables for database connections
- Rotate credentials regularly
- Use encrypted connections (SSL/TLS)
- Implement least privilege access

---

## 📦 Migration Package Contents

```
database/migration/
├── README.md                      # This file
├── DATABASE_CREDENTIALS.txt       # Database credentials reference
├── MIGRATION_SUMMARY.txt          # Migration summary
├── RESTORE.sh                     # Automated restore script
└── scripts/
    ├── export-databases.sh        # Export script
    ├── verify-restore.sh          # Verification script
    └── migrate-to-new-schema.sh   # Schema migration script
```

---

## 🚀 Quick Start

### Option 1: Automated Restore (Recommended)

```bash
# 1. Navigate to migration directory
cd database/migration

# 2. Make restore script executable
chmod +x RESTORE.sh

# 3. Run automated restore
./RESTORE.sh

# 4. Verify restoration
./scripts/verify-restore.sh
```

### Option 2: Manual Restore

**MySQL Databases:**
```bash
# Restore individual MySQL database
mysql -u root -p < hpDB_full_dump.sql

# Or with specific credentials
mysql -u mysql -p1dd933bed7f72532 < hpDB_full_dump.sql
```

**PostgreSQL Database:**
```bash
# Restore PostgreSQL database
psql -U postgres < postgres_healthpay_dump.sql

# Or create database first
createdb -U postgres healthpay
psql -U postgres healthpay < postgres_healthpay_dump.sql
```

---

## 📝 Detailed Migration Steps

### Step 1: Pre-Migration Checklist

- [ ] Verify sufficient disk space (check dump file sizes)
- [ ] Backup existing databases (if any)
- [ ] Verify MySQL 8.0+ and PostgreSQL 11+ are installed
- [ ] Ensure database services are running
- [ ] Review DATABASE_CREDENTIALS.txt for connection details
- [ ] Test restore in non-production environment first

### Step 2: Environment Setup

**Install Required Tools:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mysql-client postgresql-client

# macOS
brew install mysql-client postgresql

# Verify installations
mysql --version
psql --version
```

**Configure Database Connections:**

```bash
# MySQL connection test
mysql -u root -p -e "SELECT VERSION();"

# PostgreSQL connection test
psql -U postgres -c "SELECT version();"
```

### Step 3: Database Restoration

**MySQL Databases (All 5):**

```bash
# Set MySQL credentials
export MYSQL_USER="mysql"
export MYSQL_PASS="1dd933bed7f72532"

# Restore hpDB (Main Database)
echo "Restoring hpDB..."
mysql -u $MYSQL_USER -p$MYSQL_PASS < hpDB_full_dump.sql

# Restore Ledger Databases
for db in hpLedger hpLedger2 hpLedger3 hpLedgerRenewed; do
    echo "Restoring $db..."
    mysql -u mysql -p44751d947b76d53b < ${db}_full_dump.sql
done
```

**PostgreSQL Database:**

```bash
# Create database
createdb -U postgres healthpay

# Restore data
psql -U postgres healthpay < postgres_healthpay_dump.sql

# Verify restoration
psql -U postgres healthpay -c "\dt"
```

### Step 4: Post-Migration Verification

**Verify MySQL Databases:**

```bash
# Check database exists
mysql -u root -p -e "SHOW DATABASES;"

# Check table count
mysql -u root -p hpDB -e "SHOW TABLES;"

# Check row counts
mysql -u root -p hpDB -e "
    SELECT 
        table_name, 
        table_rows 
    FROM information_schema.tables 
    WHERE table_schema = 'hpDB';"
```

**Verify PostgreSQL Database:**

```bash
# Check tables
psql -U postgres healthpay -c "\dt"

# Check row counts
psql -U postgres healthpay -c "
    SELECT 
        schemaname, 
        tablename, 
        n_live_tup as row_count 
    FROM pg_stat_user_tables 
    ORDER BY n_live_tup DESC;"
```

### Step 5: Update Application Configuration

**Update Environment Variables:**

```bash
# .env file
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hpDB
DB_USER=mysql
DB_PASSWORD=1dd933bed7f72532

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=healthpay
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your_postgres_password>
```

**Test Application Connectivity:**

```bash
# Test MySQL connection
npm run test:db:mysql

# Test PostgreSQL connection
npm run test:db:postgres
```

---

## 🔄 Migration Scenarios

### Scenario 1: Development to Staging

```bash
# 1. Export from development
./scripts/export-databases.sh development

# 2. Transfer dumps to staging
scp *.sql staging-server:/path/to/migration/

# 3. Restore on staging
ssh staging-server
cd /path/to/migration
./RESTORE.sh

# 4. Verify
./scripts/verify-restore.sh
```

### Scenario 2: Staging to Production

```bash
# 1. Backup production databases first
./scripts/backup-production.sh

# 2. Export from staging
./scripts/export-databases.sh staging

# 3. Transfer to production (encrypted)
scp -i production.pem *.sql production-server:/secure/migration/

# 4. Restore on production (during maintenance window)
ssh -i production.pem production-server
cd /secure/migration
./RESTORE.sh

# 5. Verify and test
./scripts/verify-restore.sh
npm run test:integration
```

### Scenario 3: Cloud Migration (AWS/Azure/GCP)

**AWS RDS Migration:**

```bash
# 1. Create RDS instances
aws rds create-db-instance \
    --db-instance-identifier healthpay-mysql \
    --db-instance-class db.t3.medium \
    --engine mysql \
    --master-username admin \
    --master-user-password <password>

# 2. Import data
mysql -h healthpay-mysql.xxxxx.rds.amazonaws.com \
      -u admin -p < hpDB_full_dump.sql

# 3. Update application config
export DB_HOST=healthpay-mysql.xxxxx.rds.amazonaws.com
```

**Azure Database Migration:**

```bash
# 1. Create Azure Database for MySQL
az mysql server create \
    --resource-group healthpay-rg \
    --name healthpay-mysql \
    --admin-user admin \
    --admin-password <password>

# 2. Import data
mysql -h healthpay-mysql.mysql.database.azure.com \
      -u admin@healthpay-mysql -p < hpDB_full_dump.sql
```

**Google Cloud SQL Migration:**

```bash
# 1. Create Cloud SQL instance
gcloud sql instances create healthpay-mysql \
    --tier=db-n1-standard-2 \
    --region=us-central1

# 2. Import data
gcloud sql import sql healthpay-mysql \
    gs://healthpay-backups/hpDB_full_dump.sql \
    --database=hpDB
```

---

## 🛠️ Troubleshooting

### Common Issues

**Issue 1: Access Denied Error**

```bash
# Error: Access denied for user 'mysql'@'localhost'

# Solution: Use root user or correct credentials
mysql -u root -p < hpDB_full_dump.sql

# Or grant permissions
GRANT ALL PRIVILEGES ON hpDB.* TO 'mysql'@'localhost';
FLUSH PRIVILEGES;
```

**Issue 2: Database Already Exists**

```bash
# Error: Can't create database 'hpDB'; database exists

# Solution: Drop and recreate
mysql -u root -p -e "DROP DATABASE IF EXISTS hpDB;"
mysql -u root -p < hpDB_full_dump.sql
```

**Issue 3: Insufficient Disk Space**

```bash
# Check available space
df -h

# Solution: Free up space or use larger volume
# Compress dumps
gzip *.sql

# Restore from compressed
gunzip < hpDB_full_dump.sql.gz | mysql -u root -p
```

**Issue 4: Character Encoding Issues**

```bash
# Solution: Specify encoding
mysql -u root -p --default-character-set=utf8mb4 < hpDB_full_dump.sql

# For PostgreSQL
psql -U postgres -c "CREATE DATABASE healthpay ENCODING 'UTF8';"
```

**Issue 5: Slow Restore Performance**

```bash
# Solution: Disable indexes during restore
mysql -u root -p -e "SET FOREIGN_KEY_CHECKS=0;"
mysql -u root -p < hpDB_full_dump.sql
mysql -u root -p -e "SET FOREIGN_KEY_CHECKS=1;"

# For large databases, use parallel restore
mysqlimport --parallel=4 ...
```

---

## 📊 Database Schema Information

### MySQL Databases

**hpDB (Main Database)**
- Tables: ~50 tables
- Primary entities: Users, Wallets, Transactions, Payments
- Estimated size: ~500 MB

**hpLedger Series**
- Tables: ~20 tables per database
- Primary entities: Ledger entries, balances, audit logs
- Estimated size: ~200 MB each

### PostgreSQL Database

**healthpay**
- Tables: ~30 tables
- Primary entities: Events, projections, read models
- Estimated size: ~300 MB

---

## 🔒 Security Best Practices

### 1. Credential Management

```bash
# Use environment variables
export DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id healthpay/db/password \
    --query SecretString \
    --output text)

# Use .pgpass for PostgreSQL
echo "localhost:5432:healthpay:postgres:password" >> ~/.pgpass
chmod 600 ~/.pgpass
```

### 2. Encrypted Connections

```bash
# MySQL with SSL
mysql --ssl-mode=REQUIRED \
      --ssl-ca=/path/to/ca.pem \
      -h hostname -u user -p

# PostgreSQL with SSL
psql "sslmode=require host=hostname dbname=healthpay user=postgres"
```

### 3. Backup Encryption

```bash
# Encrypt dumps
mysqldump -u root -p hpDB | gzip | openssl enc -aes-256-cbc -salt -out hpDB.sql.gz.enc

# Decrypt and restore
openssl enc -aes-256-cbc -d -in hpDB.sql.gz.enc | gunzip | mysql -u root -p
```

---

## 📅 Maintenance

### Regular Backups

```bash
# Daily automated backup
0 2 * * * /path/to/scripts/export-databases.sh >> /var/log/db-backup.log 2>&1

# Weekly full backup
0 3 * * 0 /path/to/scripts/full-backup.sh >> /var/log/db-backup.log 2>&1
```

### Monitoring

```bash
# Check database size
mysql -u root -p -e "
    SELECT 
        table_schema AS 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
    FROM information_schema.tables
    GROUP BY table_schema;"

# Check PostgreSQL size
psql -U postgres -c "
    SELECT 
        pg_database.datname,
        pg_size_pretty(pg_database_size(pg_database.datname)) AS size
    FROM pg_database;"
```

---

## 📞 Support

For migration assistance:
1. Review this documentation
2. Check troubleshooting section
3. Verify database credentials in DATABASE_CREDENTIALS.txt
4. Contact HealthFlow DevOps team

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Review migration plan
- [ ] Backup existing databases
- [ ] Verify disk space
- [ ] Test in non-production environment
- [ ] Schedule maintenance window (if production)

### During Migration
- [ ] Stop application services
- [ ] Export databases
- [ ] Transfer dumps securely
- [ ] Restore databases
- [ ] Verify data integrity

### Post-Migration
- [ ] Update application configuration
- [ ] Test database connectivity
- [ ] Run integration tests
- [ ] Monitor application logs
- [ ] Verify user functionality
- [ ] Update documentation

---

**Last Updated**: December 16, 2024  
**Maintained By**: HealthFlow DevOps Team
