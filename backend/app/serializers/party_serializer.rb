class PartySerializer < Blueprinter::Base
  identifier :id

  fields :name, :village_city, :phone, :opening_balance, :party_type,
         :account_no, :bank, :notes, :created_at, :updated_at
end
