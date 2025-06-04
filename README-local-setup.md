# Local Development Setup

## Running Locally

To run the TailTrack app locally:

### Quick Start

1. **Clone and setup**:
   ```bash
   git clone https://github.com/cweds/tailtrack.git
   cd tailtrack
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your database**:
   ```
   # Production database
   DATABASE_URL="postgresql://***REMOVED***:REDACTED_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   
   # Development database (uncomment to use)
   # DATABASE_URL="postgresql://postgres.mhdpbjlxwstgzfrnyhyi:REDACTED_PASSWORD@aws-0-us-east-2.pooler.supabase.com:6543/postgres"
   
   RESEND_API_KEY="REDACTED_API_KEY"
   ```

4. **Run the app**:
   ```bash
   npm run dev
   ```

### Switching Databases

To switch between production and development data, simply change the `DATABASE_URL` in your `.env` file and restart the server.

### Available Commands

- `npm run dev` - Development server
- `npm run build` - Build for production
- `npm start` - Run production build

### Database Setup

The app connects to your Supabase database using the DATABASE_URL. No additional setup needed - it uses the existing schema and data.

### Accessing the App

- Development: http://localhost:5000
- Production: https://tailtrack.app

### Security Notes

- Never commit `.env` files to Git
- Rotate database passwords if credentials are exposed
- Use production database responsibly during local testing