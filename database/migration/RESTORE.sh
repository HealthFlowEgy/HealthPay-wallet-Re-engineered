#!/bin/bash
# Database Restore Script

echo "=== HEALTHPAY DATABASE RESTORE ==="
echo ""
echo "This script will restore all databases from the exported dumps."
echo ""

# MySQL Databases
MYSQL_DATABASES="hpDB hpLedger hpLedger2 hpLedger3 hpLedgerRenewed"

echo "Restoring MySQL databases..."
for db in $MYSQL_DATABASES; do
    if [ -f "${db}_full_dump.sql" ]; then
        echo "Restoring $db..."
        mysql -u root -p < ${db}_full_dump.sql
        echo "✓ $db restored"
    else
        echo "✗ ${db}_full_dump.sql not found"
    fi
done

echo ""
echo "Restoring PostgreSQL..."
if [ -f "postgres_healthpay_dump.sql" ]; then
    psql -U postgres < postgres_healthpay_dump.sql
    echo "✓ PostgreSQL restored"
else
    echo "✗ postgres_healthpay_dump.sql not found"
fi

echo ""
echo "=== RESTORE COMPLETE ==="
