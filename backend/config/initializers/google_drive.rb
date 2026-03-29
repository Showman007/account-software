# Google Drive configuration
# Required environment variables:
#   GOOGLE_CLIENT_ID       - OAuth2 Client ID from Google Cloud Console
#   GOOGLE_CLIENT_SECRET   - OAuth2 Client Secret
#   GOOGLE_REFRESH_TOKEN   - Refresh token obtained via one-time OAuth flow
#   GOOGLE_DRIVE_FOLDER_ID - ID of the Google Drive folder for uploads

GOOGLE_DRIVE_REQUIRED_VARS = %w[
  GOOGLE_CLIENT_ID
  GOOGLE_CLIENT_SECRET
  GOOGLE_REFRESH_TOKEN
  GOOGLE_DRIVE_FOLDER_ID
].freeze

GOOGLE_DRIVE_CONFIGURED = GOOGLE_DRIVE_REQUIRED_VARS.all? { |var| ENV[var].present? }

unless GOOGLE_DRIVE_CONFIGURED
  missing = GOOGLE_DRIVE_REQUIRED_VARS.reject { |var| ENV[var].present? }
  Rails.logger.warn "Google Drive integration disabled. Missing env vars: #{missing.join(', ')}"
end
