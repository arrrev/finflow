# Deployment Guide

The recent changes include a **Database Schema Migration** (switching from Name-based to ID-based links). You must update your production database for the app to work.

## 1. Backup Database
**CRITICAL:** Before running any commands, backup your production database.
```bash
pg_dump -h [YOUR_PROD_HOST] -U [YOUR_USER] finance_tracker > backup_before_migration.sql
```

## 2. Deploy Code
Pull the latest code from git and rebuild:
```bash
git pull origin main
npm install
npm run build
# Restart your process manager (e.g., pm2 restart finance_tracker)
```

## 3. Run Database Migration
Execute the migration script against your production database. This script safely adds the new ID columns, migrates existing data, and updates uniqueness constraints.

**Using psql:**
```bash
psql -h [YOUR_PROD_HOST] -U [YOUR_USER] -d finance_tracker -f scripts/migrate_ids.sql
```

**Using docker (if running postgres in docker on prod):**
```bash
cat scripts/migrate_ids.sql | docker exec -i [PROD_DB_CONTAINER_NAME] psql -U postgres -d finance_tracker
```

## 4. Verify
Login to the app and check:
- Transaction history (should show existing items).
- Create a new transaction (should work).
- Account creation (check if you can create an account name that previously existed).
