# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack web application for analyzing railway alarm chain pulling incidents data. The application consists of:

- **Backend**: FastAPI Python server (v0.104.1) with comprehensive data processing capabilities for alarm chain incidents
- **Frontend**: React TypeScript application (React v19.1.1) with Ant Design (v5.27.1) components and Recharts (v3.1.2) for interactive dashboards and data visualization

## Architecture

### Backend (FastAPI)
- **Entry point**: `backend/main.py` - Main FastAPI application with CORS configuration
- **Core functionality**: 
  - CSV file upload and processing with pandas for alarm chain data
  - In-memory caching system using file content hashing
  - Data filtering, and analytics specific to railway incidents
  - RESTful API endpoints for alarm chain data operations
- **Key features**:
  - Multiple CSV file upload support (up to 3 files) for alarm chain incidents
  - Date parsing optimized for DD-MM-YYYY format (Indian date format)
  - Comprehensive analytics for incident trends, categories, reasons, coach types, directions
  - Timeline data aggregation with configurable granularity (daily/weekly/monthly)
  - Advanced filtering for railway-specific attributes (train numbers, sections, coach types, RPF posts)
  - Real-time KPI calculations with percentile rankings for train performance
  - Export functionality (CSV/JSON) with filtered data
  - In-memory caching with MD5 hash-based keys for optimal performance

### Frontend (React + TypeScript + Ant Design)
- **Entry point**: `frontend/src/App.tsx` - Main React component with routing
- **Key components**:
  - `NewDashboard.tsx` - Main analytical dashboard with comprehensive data visualization
  - `GlobalFilters.tsx` - Advanced filtering interface with timeframe selection and multi-select dropdowns
  - `KPICards.tsx` - Key Performance Indicator cards with sparkline trends
  - `NavigationRail.tsx` - Collapsible navigation sidebar
  - `AllIncidents.tsx` - Paginated table view of all incidents
  - `TrainProfile.tsx` - Individual train analysis with detailed metrics
  - `TrainList.tsx` - Top 25 affected trains listing
  - `TopSections.tsx` - Section-wise incident analysis
- **Data visualization features**:
  - Interactive timeline charts (area charts) with monthly/weekly/daily granularity and data labels
  - Top 25 affected trains chart (horizontal bar chart) sorted highest to lowest
  - Section-wise analysis with drill-down capabilities
  - Coach category distribution charts with data labels
  - Reason analysis (horizontal bar charts with data labels for better readability)
  - Time slot analysis (pie charts with 11 individual slots + "Others" category)
  - Mid-section analysis with geographic insights and data labels
  - Day-wise incident pattern analysis with data labels
- **User Experience**: 
  - Responsive design with mobile-first approach
  - Real-time filtering with immediate chart updates
  - Export functionality (CSV/JSON) with current filter state
  - Loading states and error handling
  - Collapsible navigation for better screen utilization
  - Advanced timeframe selection (All/Month/Custom) with month picker
  - Smart filtering with RPF Posts and Trains sorted by incident count
  - Dynamic KPI cards with daily trend analysis and direction indicators

## Development Commands

### Backend
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
python main.py
# Server runs on http://localhost:8000

# Production server
# uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# Runs on http://localhost:3000 with proxy to backend

# Build for production
npm run build

# Run tests
npm test
```

## Data Requirements

The application expects CSV files with these specific alarm chain pulling columns:
- `DATE_M` - Incident date in DD-MM-YYYY format (required)
- `DAY NAME_F` - Day name (optional)
- `Train No` - Train number (required)
- `Train From_To` - Train route information (required)
- `Direction UP/Down` - Train direction (required)
- `Daily/Non-daily` - Service type (optional)
- `FROM` - Incident start time in HH:MM:SS (optional)
- `TO` - Incident end time in HH:MM:SS (optional)
- `Time Analysis` - Time analysis data (optional)
- `Duration` - Incident duration (optional)
- `POST_Names` - Railway post names (optional)
- `SOUTH/NORTH` - Geographic direction (optional)
- `STN/SEC from` - Station/Section from (optional)
- `Mid section` - Middle section (optional)
- `Broad section` - Broad section classification (optional)
- `K.M.No` - Kilometer number (optional)
- `KM anlysis` - Kilometer analysis (optional)
- `COACH` - Coach information (optional)
- `Coach No.` - Coach number (optional)
- `Reason` - Incident reason (required)
- `CATEGORY` - Incident category (required)
- `Remarks` - Additional remarks (optional)
- `ESCORT` - Escort information (optional)
- `STATUS` - Incident status (optional)
- `Punctuality loss` - Time loss due to incident (optional)
- `Type of coach` - Coach type classification (optional)
- `Pantry car` - Pantry car involvement (optional)
- `Other reasons` - Additional reasons (optional)
- `Guard` - Guard information (optional)
- `LP/ALP` - Locomotive Pilot/Assistant information (optional)
- `TTE` - Travelling Ticket Examiner information (optional)
- `Rectified by` - Resolution information (optional)

## Key API Endpoints

### Data Management
- `POST /upload` - Upload and process alarm chain CSV files (max 3 files)
- `GET /filter-options/{cache_key}` - Get available filter options for alarm data
- `GET /health` - Health check endpoint

### Analytics & KPIs
- `POST /kpi-data/{cache_key}` - Get KPI data (total incidents, percentile, daily average, monthly trend, daily trend)
- `POST /analytics/{cache_key}` - Get general statistics and analytics for alarm incidents
- `POST /day-analysis/{cache_key}` - Get day-wise incident analysis

### Data Views
- `POST /table/{cache_key}` - Get paginated table data for incidents
- `POST /timeline/{cache_key}` - Get timeline/trend data with configurable granularity
- `POST /train-list/{cache_key}` - Get top affected trains (configurable limit, default 25)

### Train-Specific Analysis
- `POST /train-incidents/{cache_key}` - Get train incident counts with customizable limit
- `POST /train-analytics/{cache_key}` - Get detailed analytics for specific train or all trains
- `POST /train-timeline/{cache_key}` - Get timeline data for specific train
- `GET /train-search/{cache_key}` - Search trains by number with query parameter

### Export
- `POST /export-data/{cache_key}` - Export filtered data in CSV or JSON format

**Note**: All POST endpoints accept FilterRequest in the request body with optional query parameters for additional configuration.

## Development Notes

### Backend Architecture
- FastAPI 0.104.1 with Uvicorn 0.24.0 as ASGI server
- Uses file content MD5 hashing for efficient caching of alarm chain data
- Automatic OpenAPI documentation available at `/docs`
- Pandas 2.1.4-based data processing with optimized memory usage
- Date parsing using `dayfirst=True` for Indian DD-MM-YYYY format
- CORS middleware configured for development server access
- Type-safe request/response models using Pydantic 2.5.0
- Python-multipart 0.0.6 for file upload handling
- Smart filtering with incident count-based sorting for RPF Posts and Train Numbers
- Enhanced KPI data processing with both monthly and daily trend calculations
- Advanced time analysis with top 11 slots + "Others" aggregation

### Frontend Architecture
- React 19.1.1 with TypeScript (v4.9.5) for type safety
- State management using React hooks (useState, useEffect, useCallback)
- Ant Design 5.27.1 for consistent UI components
- Recharts 3.1.2 for interactive data visualization with comprehensive data labeling
- React Router DOM 7.8.2 for client-side navigation
- Axios 1.11.0 for HTTP requests with proxy configuration
- DayJS 1.11.13 for date/time manipulation
- Advanced chart rendering with proper sorting and data display optimization
- Dynamic KPI card system with trend analysis and direction detection

### Performance Optimizations
- useCallback hooks to prevent unnecessary re-renders
- Responsive chart sizing with ResponsiveContainer
- Efficient data filtering with pandas operations
- In-memory caching to avoid repeated file processing
- Pagination for large datasets

### Development Workflow
- Frontend proxy configured to backend (localhost:8000)
- Hot reloading enabled for both frontend and backend
- TypeScript strict mode enabled
- ESLint configuration for code quality

## Railway-Specific Features

### Operational Analysis
- **Direction Analysis**: UP/DOWN train direction categorization with visual distribution
- **Coach Type Tracking**: Comprehensive coach type incident pattern analysis
- **Section-wise Analysis**: Railway section and kilometer-based incident mapping with geographic insights
- **Time-based Patterns**: Multi-granular analysis (hourly, daily, weekly, monthly) of incident timing
- **Mid-section Analysis**: Detailed breakdown of incidents by railway mid-sections

### Performance Metrics
- **Punctuality Impact**: Quantified tracking of delays caused by alarm chain pulling
- **Train Performance Rankings**: Percentile-based ranking system for trains
- **Daily Averages**: Real-time calculation of incident rates per train/section
- **Trend Analysis**: Historical trend visualization with sparkline indicators

### Personnel & Resolution Tracking
- **Personnel Involvement**: Guard, TTE, LP/ALP involvement tracking and analysis
- **Resolution Tracking**: Comprehensive monitoring of incident resolution by personnel type
- **RPF Post Analysis**: Railway Protection Force post-wise incident categorization
- **Status Monitoring**: Real-time incident status tracking and resolution timelines

### Advanced Analytics
- **Top 25 Analysis**: Detailed analysis of most affected trains with drill-down capabilities, properly sorted highest to lowest
- **Day Pattern Analysis**: Weekly incident pattern recognition (Monday-Sunday)
- **Reason Categorization**: Hierarchical categorization of incident reasons with frequency analysis and horizontal bar chart display
- **Coach Position Analysis**: Analysis based on specific coach positions and types with simplified "Coaches" heading
- **Enhanced Time Analysis**: 24-hour time slot analysis with top 11 individual periods plus "Others" category, displayed clockwise from highest to lowest
- **Dynamic KPI System**: Real-time trend detection with daily patterns for All/Month/Custom timeframe modes

## Current Technical Status

### Recent Fixes & Improvements
- **API Parameter Structure**: Fixed incorrect axios parameter passing from frontend to backend APIs
- **Data Population Issues**: Resolved dashboard data and graph population problems  
- **Top 25 Trains Feature**: Implemented proper display of top 25 affected trains (previously showing only 10)
- **React Hook Dependencies**: Fixed useCallback and useEffect dependency warnings for optimal performance
- **Chart Responsiveness**: Enhanced chart rendering with proper data limits and responsive design
- **Enhanced KPI Cards**: Implemented daily trend analysis with direction detection (Increasing/Decreasing/Stable)
- **Advanced Filtering**: RPF Post and Train filters now sorted by incident count (highest to lowest)
- **Comprehensive Data Labeling**: Added data labels to all charts (bar, horizontal bar, pie, timeline)
- **Improved Chart Headings**: Updated chart titles - "Coaches", "Reasons", "Time Analysis"
- **Time Analysis Enhancement**: Implemented 11 individual slots + "Others" with proper clockwise sorting
- **Month Selection**: Added month picker for timeframe mode with "No data available" messaging
- **Sorting Optimization**: All charts now display data sorted from highest to lowest values

### Known Working Features
- CSV file upload and processing (tested with backend/frontend integration)
- Real-time data filtering with immediate UI updates
- Enhanced KPI card display with daily trend analysis and direction indicators
- Interactive charts with comprehensive data labeling and proper sorting
- Export functionality (CSV/JSON) with current filter state
- Multi-train analysis with drill-down capabilities
- Responsive navigation with collapsible sidebar
- Advanced timeframe selection with month picker and custom date ranges
- Smart filter sorting based on incident frequency
- Comprehensive time analysis with 11+1 slot distribution
- "No data available" messaging for empty month selections
- All chart types working with proper data display and sorting

### Development Server Status
- Backend server: Runs on `http://localhost:8000` with auto-reload
- Frontend server: Runs on `http://localhost:3000` with proxy to backend
- Hot reloading enabled for both development servers
- CORS properly configured for cross-origin requests

### Code Quality
- TypeScript strict mode enforced
- ESLint warnings addressed for React hooks best practices
- Proper error handling and loading states implemented
- API endpoints tested and verified working
- Enhanced data processing with null handling and proper sorting algorithms
- Optimized chart rendering performance with LabelList components
- Comprehensive trend analysis algorithms with statistical calculations
- Smart data aggregation for time analysis with "Others" category handling

## important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.