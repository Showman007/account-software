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

      # Query Runner (admin only)
      post 'query_runner', to: 'query_runner#execute'
      get 'query_runner/tables', to: 'query_runner#tables'

      # Reports & Analytics
      get 'dashboard', to: 'dashboard#index'
      get 'master_ledger', to: 'master_ledger#index'
      get 'party_ledger/:id', to: 'party_ledger#show', as: :party_ledger
      get 'profit_calculator', to: 'profit_calculator#index'

      # Attachments (Google Drive)
      get ':attachable_type/:attachable_id/attachment', to: 'attachments#show', as: :show_attachment
      post ':attachable_type/:attachable_id/attachment', to: 'attachments#create', as: :create_attachment
      delete ':attachable_type/:attachable_id/attachment', to: 'attachments#destroy', as: :destroy_attachment

      # Bill generation (PDF)
      get 'bills/:bill_type/:id', to: 'bills#show', as: :bill

      # Import/Export
      post 'imports', to: 'imports#create'
      get 'exports/:id', to: 'exports#show', as: :export
    end
  end
end
