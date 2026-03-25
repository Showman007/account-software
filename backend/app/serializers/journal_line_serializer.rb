class JournalLineSerializer < Blueprinter::Base
  identifier :id

  fields :account_name, :account_type, :debit, :credit,
         :party_id, :partner_id
end
