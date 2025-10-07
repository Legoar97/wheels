# 🚗 WHEELS Complete Matchmaking System Setup

This guide provides a complete solution for setting up the Python matchmaking system as an API that automatically executes when new records are added to the `searching_pool` table.

## 📋 Overview

The complete system includes:
- ✅ **Python Matching Algorithm** (`matchmaking_original.py`) - Your existing logic
- ✅ **Flask API Server** (`matchmaking_api.py`) - Exposes matching as REST API
- ✅ **Database Triggers** - Automatic execution on new records
- ✅ **Frontend Integration** - Real-time display of matches
- ✅ **Email-based Identification** - Uses email to lookup user profiles

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Database       │    │   Python API    │
│   (React)       │    │   (Supabase)     │    │   (Flask)       │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • User creates  │    │ • searching_pool │    │ • Matching      │
│   trip request  │───▶│ • Trigger fires  │───▶│   algorithm     │
│ • Shows matches │◀───│ • Stores results │◀───│ • Returns JSON  │
│ • Email-based   │    │ • profiles table │    │ • Email lookup  │
│   identification│    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Matchmaking API

```bash
# Basic startup
python matchmaking_api.py

# Or use the enhanced startup script
python start_matchmaking_api.py
```

### 3. Configure Frontend

Add to your `.env` file:
```env
REACT_APP_PYTHON_API_URL=http://localhost:5000
```

### 4. Set Up Database Triggers

Execute the SQL file in your Supabase dashboard:
```bash
# Copy contents of database_trigger_webhook.sql and run in Supabase SQL Editor
```

## 📁 Files Created

| File | Purpose |
|------|---------|
| `matchmaking_api.py` | Main Flask API server |
| `start_matchmaking_api.py` | Enhanced startup script with notifications |
| `requirements.txt` | Python dependencies |
| `database_trigger_webhook.sql` | Database triggers for auto-execution |
| `README_COMPLETE_MATCHMAKING_SETUP.md` | This documentation |

## 🔧 Configuration

### Environment Variables

```bash
# API Server Configuration
PORT=5000                    # API server port
DEBUG=false                  # Enable debug mode
HOST=0.0.0.0                # Server host
ENABLE_NOTIFICATIONS=true    # Enable database notifications

# Database (for notification listener)
DATABASE_URL=postgresql://user:pass@host:port/db

# Frontend
REACT_APP_PYTHON_API_URL=http://localhost:5000
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/python-matchmaking` | POST | Run matchmaking algorithm |
| `/api/matches/{email}` | GET | Get matches for specific user |
| `/api/trigger-matchmaking` | POST | Triggered by database |
| `/api/health` | GET | Health check |

## 🎯 How It Works

### 1. User Creates Trip Request
- User fills out trip form in React app
- Data is inserted into `searching_pool` table
- Database trigger automatically fires

### 2. Automatic Matching Execution
```sql
-- Database trigger calls Python API
TRIGGER trigger_matchmaking_on_new_record
    AFTER INSERT ON searching_pool
    EXECUTE FUNCTION trigger_python_matchmaking();
```

### 3. Python Algorithm Runs
```python
# Enhanced matching with email identification
def match_rides_enhanced(searching_pool_df, profiles_df):
    # Separate drivers and passengers
    # Calculate distances using geopy
    # Return matches with email identifiers
    return matches
```

### 4. Frontend Displays Results
```javascript
// Real-time updates every 10 seconds
const { matches, getUserMatches } = usePythonMatchmaking();

// Email-based user identification
const userMatches = getUserMatches(currentUser.email);
```

## 🔍 Email-Based Matching System

The system now uses **email as the primary identifier** for matching:

### Database Structure
```sql
-- searching_pool table includes:
correo_usuario TEXT,  -- User's email from profiles
nombre_usuario TEXT,  -- User's name from profiles
tipo_de_usuario TEXT  -- 'conductor' or 'pasajero'
```

### Matching Response Format
```json
{
  "success": true,
  "matches": [
    {
      "conductor_id": "uuid",
      "correo_conductor": "driver@example.com",  // 👈 Email identifier
      "nombre_conductor": "Driver Name",
      "pasajeros_asignados": [
        {
          "pasajero_id": "uuid",
          "correo": "passenger@example.com",      // 👈 Email identifier
          "nombre": "Passenger Name"
        }
      ]
    }
  ]
}
```

### Frontend Display
```javascript
// Driver sees matched passengers
{match.pasajeros_asignados.map(passenger => (
  <div key={passenger.correo}>
    <h4>{passenger.nombre}</h4>
    <p>{passenger.correo}</p>
  </div>
))}

// Passenger sees matched driver
<div>
  <h4>{match.nombre_conductor}</h4>
  <p>{match.correo_conductor}</p>
</div>
```

## 🚦 Testing the System

### 1. Test API Directly
```bash
# Health check
curl http://localhost:5000/api/health

# Run matchmaking
curl -X POST http://localhost:5000/api/python-matchmaking

# Get user matches
curl http://localhost:5000/api/matches/user@example.com
```

### 2. Test Database Trigger
```sql
-- Insert a test record to trigger matching
INSERT INTO searching_pool (
    driver_id, 
    tipo_de_usuario, 
    pickup_address, 
    dropoff_address,
    pickup_lat, 
    pickup_lng,
    dropoff_lat,
    dropoff_lng
) VALUES (
    'your-user-id',
    'conductor',
    'Test Address',
    'Test Destination',
    4.6097, -74.0817,
    4.6097, -74.0817
);
```

### 3. Test Frontend Integration
1. Create a trip request in your React app
2. Check browser console for API calls
3. Verify matches appear in the interface

## 🐛 Troubleshooting

### Common Issues

#### API Connection Errors
```bash
# Check if API is running
curl http://localhost:5000/api/health

# Check logs
python matchmaking_api.py
```

#### Database Connection Issues
```python
# Test Supabase connection
from supabase import create_client
client = create_client(SUPABASE_URL, SUPABASE_KEY)
response = client.table('profiles').select('*').limit(1).execute()
print(response.data)
```

#### Frontend Not Getting Data
```javascript
// Check environment variable
console.log(process.env.REACT_APP_PYTHON_API_URL);

// Check network tab in browser dev tools
// Look for calls to /api/python-matchmaking
```

### Logs and Debugging

The API provides detailed logging:
```
🔌 Connecting to Supabase...
✅ Loaded 25 profiles, 8 searching pool records
🔍 Found 3 drivers, 5 passengers
🚗 Processing driver: driver@example.com - Destination: Universidad
✅ Matched passenger: passenger@example.com - Distance: 2.1km
🎯 Created match for driver: driver@example.com with 2 passengers
🎉 Total matches created: 2
```

## 🚀 Production Deployment

### Using Gunicorn
```bash
# Install gunicorn
pip install gunicorn

# Run with gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 matchmaking_api:app
```

### Using Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "matchmaking_api:app"]
```

### Environment Setup
```bash
# Production environment variables
export PORT=5000
export DEBUG=false
export REACT_APP_PYTHON_API_URL=https://your-api-domain.com
```

## 📊 Monitoring

### API Health Monitoring
```bash
# Simple health check script
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
if [ $response -eq 200 ]; then
    echo "API is healthy"
else
    echo "API is down: $response"
fi
```

### Database Monitoring
```sql
-- Check recent matches
SELECT 
    created_at,
    tipo_de_usuario,
    correo_usuario,
    status
FROM searching_pool 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## 🎉 Success Criteria

Your system is working correctly when:

- ✅ **New trip requests** automatically trigger matching
- ✅ **Drivers see** their matched passengers immediately
- ✅ **Passengers see** their matched driver information
- ✅ **Email identification** works for profile lookup
- ✅ **Real-time updates** occur every 10 seconds
- ✅ **API responds** within 2-3 seconds
- ✅ **Database triggers** execute without errors

## 🆘 Support

If you encounter issues:

1. **Check the logs** - API provides detailed logging
2. **Test components individually** - API, database, frontend
3. **Verify environment variables** - Especially API URLs
4. **Check database triggers** - Ensure they're properly created
5. **Monitor network requests** - Use browser dev tools

The system is designed to be robust with fallbacks and detailed error reporting to help you identify and resolve issues quickly.

---

**🎯 Result**: A fully automated matching system that executes your Python algorithm whenever users create trip requests, with real-time display of matches using email-based identification.




