puts "Seeding units..."
units_data = [
  { name: 'Quintals', abbreviation: 'Qtl' },
  { name: 'Kgs', abbreviation: 'Kg' },
  { name: 'Bags', abbreviation: 'Bag' },
  { name: 'Nos', abbreviation: 'No' },
  { name: 'Tonnes', abbreviation: 'T' },
  { name: 'Litres', abbreviation: 'L' }
]
units_data.each { |u| Unit.find_or_create_by!(name: u[:name]) { |unit| unit.abbreviation = u[:abbreviation] } }

qtl = Unit.find_by!(name: 'Quintals')
kg = Unit.find_by!(name: 'Kgs')
bag = Unit.find_by!(name: 'Bags')
nos = Unit.find_by!(name: 'Nos')

puts "Seeding products..."
# Paddy types (inbound) - matching original Excel
paddy_products = [
  'Paddy (Sona Masoori)', 'Paddy (BPT 5204)', 'Paddy (IR 64)',
  'Paddy (Swarna)', 'Paddy (MTU 1010)'
]
paddy_products.each do |name|
  Product.find_or_create_by!(name: name) do |p|
    p.category = :paddy
    p.direction = :inbound
    p.default_unit = qtl
  end
end

# Rice types (outbound) - matching original Excel
rice_products = [
  'Rice (Sona Masoori)', 'Rice (BPT 5204)', 'Rice (IR 64)',
  'Rice (Swarna)', 'Rice (MTU 1010)'
]
rice_products.each do |name|
  Product.find_or_create_by!(name: name) do |p|
    p.category = :rice
    p.direction = :outbound
    p.default_unit = qtl
  end
end

# By-products (outbound)
by_products = [
  'Broken Rice', 'Rice Bran', 'Husk', 'Rice Flour', 'Rice Bran Oil'
]
by_products.each do |name|
  Product.find_or_create_by!(name: name) do |p|
    p.category = :by_product
    p.direction = :outbound
    p.default_unit = qtl
  end
end

# Packing materials (inbound) - matching original Excel
packing_products = [
  'Packing Bags 50kg', 'Packing Bags 25kg', 'Packing Bags 10kg',
  'Gunny Bags', 'Twine Thread'
]
packing_products.each do |name|
  Product.find_or_create_by!(name: name) do |p|
    p.category = :packaging
    p.direction = :inbound
    p.default_unit = nos
  end
end

puts "Seeding expense categories..."
expense_categories = [
  'Salary', 'Milling Cost', 'Transport', 'Electricity',
  'Repair & Maintenance', 'Labour Charges', 'Packaging Material',
  'Fuel', 'Other'
]
expense_categories.each { |name| ExpenseCategory.find_or_create_by!(name: name) }

puts "Seeding payment modes..."
payment_modes = ['Cash', 'Online Transfer', 'Cheque', 'UPI', 'Credit', 'Pending']
payment_modes.each { |name| PaymentMode.find_or_create_by!(name: name) }

puts "Seeding admin user..."
User.find_or_create_by!(email: 'admin@ricemill.com') do |user|
  user.password = 'password123'
  user.password_confirmation = 'password123'
  user.role = :admin
end

puts "Seeding complete!"
