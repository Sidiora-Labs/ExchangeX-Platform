# Database

MySQL 8+, accessed through Sequelize. ~110 models in `models/`, ~98 tables.

## Setup

```bash
mysql -u root -p -e "CREATE DATABASE exchangex CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
mysql -u root -p exchangex < db/initial.sql
pnpm seed
```

`db/initial.sql` is the full schema for a fresh install. `pnpm seed` loads reference data
via `sequelize-cli` using `config.js`.

> The blanket `*.sql` rule in `.gitignore` is meant for dumps and backups. `db/initial.sql`
> is explicitly re-included with `!db/initial.sql` because the install depends on it — keep
> that negation if you touch those rules.

### Seeders

Run in filename order from `seeders/`:

| Seeder | Loads |
|---|---|
| `…-fiatCurrencies.js` | Fiat currency list |
| `…-depositGateways.js` | Payment gateway definitions |
| `…-pages.js` | CMS pages |
| `…-permissions.js` | **Canonical permission list** |
| `…-roles.js` | Roles + role→permission mapping |
| `…-superAdmin.js` | Initial superadmin account |
| `…-notificationTemplates.js` | Email/notification templates |
| `…-ecosystemTokens.js`, `…-ecosystemBlockchains.js` | Ecosystem defaults |
| `…-exchanges.js` | Exchange provider rows |
| `…-faqCategories.js`, `…-rewardConditions.js` | FAQ + MLM reward conditions |
| `…-extensions.js` | Extension registry rows |
| `…-blog.js`, `…-ecommerce-slugs.js` | Sample content |

Seeders are idempotent where it matters — the extension seeder inserts new rows and updates
existing ones by `productId`.

**Rotate the seeded superadmin password immediately after first login.**

---

## Schema changes

There is **no incremental migration framework**. Two mechanisms exist:

1. **`db/initial.sql`** — the schema a fresh install gets.
2. **`sequelize.sync({ alter: true })`** in `backend/db.ts`, which reconciles model
   definitions against the live schema at boot.

`alter: true` will add, change, **and drop** columns to match the models. That is convenient
in development and dangerous in production: removing a field from a model can drop a
populated column on the next restart.

### Changing a column safely

1. Edit the model in `models/`.
2. Edit `types/models/<model>.d.ts` and any backend schema in `backend/api/**/utils.ts`.
3. Edit `db/initial.sql` so fresh installs match.
4. For existing databases, write the explicit `ALTER TABLE` and run it during a maintenance
   window — do not rely on `alter: true` to do destructive work unattended.

For example, dropping a column from `exchange` means running:

```sql
ALTER TABLE exchange DROP COLUMN some_column;
```

alongside the model, type definition, backend schema, and `db/initial.sql` edits.

---

## Backup and restore

### From the admin UI

Admin → System → Database → Backup produces a dump; Restore uploads one. Backed by
`mysqldump` under the hood.

### From the shell

```bash
# backup
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" \
  --single-transaction --quick --routines --triggers \
  "$DB_NAME" | gzip > "backup-$(date +%F-%H%M).sql.gz"

# restore
gunzip < backup-2026-09-09-1430.sql.gz | mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
```

`--single-transaction` gives a consistent snapshot of InnoDB tables without locking writes.

Automate it:

```cron
0 */6 * * * /usr/local/bin/exchangex-backup.sh >> /var/log/exchangex-backup.log 2>&1
```

**A backup you have never restored is not a backup.** Test the restore path into a scratch
database before you need it.

---

## Table groups

| Group | Tables |
|---|---|
| Identity | `user`, `role`, `permission`, `role_permission`, `provider_user`, `two_factor`, `one_time_token`, `api_key` |
| KYC | `kyc`, `kyc_template` |
| Wallets | `wallet`, `wallet_data`, `wallet_pnl`, `transaction`, `deposit_gateway`, `deposit_method`, `withdraw_method`, `currency` |
| Exchange | `exchange`, `exchange_currency`, `exchange_market`, `exchange_order`, `exchange_watchlist` |
| Ecosystem | `ecosystem_blockchain`, `ecosystem_token`, `ecosystem_market`, `ecosystem_master_wallet`, `ecosystem_custodial_wallet`, `ecosystem_private_ledger`, `ecosystem_utxo` |
| Derivatives | `futures_market`, `binary_order` |
| Investments | `investment`, `investment_plan`, `investment_duration`, `investment_plan_duration`, `ai_investment*`, `forex_*`, `staking_*` |
| P2P | `p2p_offer`, `p2p_trade`, `p2p_escrow`, `p2p_dispute`, `p2p_review`, `p2p_commission`, `p2p_payment_method` |
| ICO | `ico_project`, `ico_token`, `ico_phase`, `ico_allocation`, `ico_contribution`, `ico_phase_allocation` |
| MLM | `mlm_referral`, `mlm_binary_node`, `mlm_unilevel_node`, `mlm_referral_condition`, `mlm_referral_reward` |
| E-commerce | `ecommerce_product`, `ecommerce_order`, `ecommerce_order_item`, `ecommerce_category`, `ecommerce_discount`, `ecommerce_review`, `ecommerce_shipping`, `ecommerce_wishlist*` |
| NFT | `nft_collection`, `nft_asset`, `nft_auction`, `nft_bid`, `nft_transaction`, `nft_like`, `nft_follow`, `nft_comment` |
| Content | `page`, `post`, `category`, `tag`, `post_tag`, `author`, `comment`, `slider`, `faq`, `faq_category` |
| Mail | `mailwizard_campaign`, `mailwizard_template`, `mailwizard_block`, `notification`, `notification_template` |
| Support | `support_ticket`, `announcement` |
| Platform | `settings`, `extension`, `invoice`, `payment_intent`, `payment_intent_product`, `admin_profit` |

### Known dead tables

Present in the schema, referenced by nothing:

| Table | Status |
|---|---|
| `frontend` | No model, no code references |
| `forex_currency` | No model, no code references — the forex extension uses `currency` |
| `mailwizard_block` | Model and types exist; zero `models.mailwizardBlock` usages |

They are retained deliberately — dropping tables is irreversible and they cost nothing. If
you do remove them, delete the model, its `types/models/*.d.ts`, its `models/init.ts`
registration, and the `CREATE TABLE` in `db/initial.sql` together.

---

## Conventions

- **Primary keys** — `char(36)` UUIDs, `DataTypes.UUIDV4` default. Not auto-increment.
- **Timestamps** — `createdAt` / `updatedAt`, camelCase.
- **Soft deletes** — `deletedAt` where present; those models set `paranoid: true`.
- **Charset** — `utf8mb4` throughout; UUID columns use `utf8mb4_bin` for exact matching.
- **Validation** — enforced in the model's `validate:` block, with messages in
  `"field: Human readable message"` form.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| `ER_NO_SUCH_TABLE` at boot | `db/initial.sql` never imported |
| Columns vanish after a restart | `sync({ alter: true })` reconciling a model you edited |
| `ER_TOO_LONG_KEY` | Index on a `varchar(255)` under `utf8mb4`; keep indexed strings ≤ 191 |
| Emoji become `???` | Table or connection not `utf8mb4` |
| Permission denied in admin despite a role | Permission string not in the seeder, or `pnpm seed` not re-run |
| Seeder fails on a duplicate | Partially applied seed; clear the affected table and re-run |
