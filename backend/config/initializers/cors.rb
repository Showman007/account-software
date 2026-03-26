Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    allowed_origins = [
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]

    # Allow Railway frontend domain in production
    if ENV["FRONTEND_URL"].present?
      allowed_origins << ENV["FRONTEND_URL"]
    end

    # Allow all railway.app subdomains in production
    if Rails.env.production?
      allowed_origins << /\Ahttps:\/\/.*\.railway\.app\z/
    end

    origins(*allowed_origins)

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      max_age: 600
  end
end
