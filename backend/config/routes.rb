Rails.application.routes.draw do
  devise_for :users, skip: :all

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/sign_in', to: 'auth#sign_in'
      delete 'auth/sign_out', to: 'auth#sign_out'
      get 'auth/me', to: 'auth#me'
      post 'auth/register', to: 'registrations#create'

      # Core resources
      resources :parties
      resources :inbound_entries
      resources :outbound_entries
      resources :milling_batches
      resources :expenses
      resources :payments, only: [:index, :show, :create] do
        member do
          post :reverse
        end
      end
      resources :partners
      resources :credit_transactions

      # Stock management
      resources :stock_items do
        collection do
          post :recalculate
        end
      end

      # User management (admin only)
      resources :users

      # Master data
      resources :products
      resources :units
      resources :expense_categories
      resources :payment_modes

      # Journal / Audit
      resources :journal_entries, only: [:index, :show] do
        collection do
          post :backfill
        end
      end

      # Reports & Analytics
      get 'dashboard', to: 'dashboard#index'
      get 'master_ledger', to: 'master_ledger#index'
      get 'party_ledger/:id', to: 'party_ledger#show', as: :party_ledger
      get 'profit_calculator', to: 'profit_calculator#index'

      # Import/Export
      post 'imports', to: 'imports#create'
      get 'exports/:id', to: 'exports#show', as: :export
    end
  end
end
