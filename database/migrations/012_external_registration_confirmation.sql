USE event_management_system;

SET @confirmation_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'event_registrations'
      AND COLUMN_NAME = 'external_form_submitted'
);

SET @confirmation_migration = IF(
    @confirmation_column_exists = 0,
    'ALTER TABLE event_registrations
     ADD COLUMN external_form_submitted BOOLEAN NOT NULL DEFAULT FALSE',
    'SELECT 1'
);

PREPARE confirmation_statement FROM @confirmation_migration;
EXECUTE confirmation_statement;
DEALLOCATE PREPARE confirmation_statement;