# Alarm Chain Pulling Analytics Dashboard

A full-stack web application for analyzing railway alarm chain pulling incidents data. Built with FastAPI backend and React frontend with comprehensive data visualization capabilities.

## 🚀 Features

- **CSV File Upload**: Support for uploading alarm chain pulling incident data
- **Interactive Filtering**: Filter by date range, train numbers, directions, categories, reasons, coach types, and sections  
- **Data Visualization**: 
  - Timeline trends (monthly aggregation)
  - Direction distribution (pie chart)
  - Top categories analysis (bar chart) 
  - Coach type distribution (bar chart)
  - Top reasons analysis (bar chart)
- **Data Table**: Paginated view with detailed incident information
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Analytics**: Statistics and charts update based on applied filters

## 🏗️ Architecture

### Backend (FastAPI)
- **Entry Point**: `backend/main.py`
- **Key Features**:
  - CSV file processing with pandas
  - In-memory caching using file content hashing
  - RESTful API endpoints for data operations
  - CORS configuration for frontend integration
  - Data filtering and analytics processing

### Frontend (React + TypeScript)
- **Entry Point**: `frontend/src/App.tsx` 
- **UI Framework**: Ant Design components
- **Charts**: Recharts library for data visualization
- **State Management**: React hooks (useState, useEffect)
- **HTTP Client**: Axios for API communication

## 📋 Data Requirements

The application expects CSV files with these columns:

| Column | Description | Format |
|--------|-------------|--------|
| DATE_M | Incident date | DD-MM-YYYY |
| DAY NAME_F | Day name | String |
| Train No | Train number | String |
| Train From_To | Train route | String |
| Direction UP/Down | Train direction | UP/Down |
| Daily/Non-daily | Service type | String |
| FROM | Start time | HH:MM:SS |
| TO | End time | HH:MM:SS |
| Time Analysis | Time analysis | String |
| Duration | Time difference | String |
| POST_Names | Post names | String |
| SOUTH/NORTH | Geographic direction | String |
| STN/SEC from | Station/Section | String |
| Mid section | Middle section | String |
| Broad section | Broad section | String |
| K.M.No | Kilometer number | String |
| KM anlysis | KM analysis | String |
| COACH | Coach information | String |
| Coach No. | Coach number | String |
| Reason | Incident reason | String |
| Column2 | Additional column | String |
| CATEGORY | Incident category | String |
| Remarks | Additional remarks | String |
| ESCORT | Escort information | String |
| STATUS | Incident status | String |
| Punctuality loss | Time loss | String |
| Type of coach | Coach type | String |
| Pantry car | Pantry car info | String |
| Other reasons | Other reasons | String |
| Guard | Guard information | String |
| LP/ALP | Driver information | String |
| TTE | TTE information | String |
| Rectified by | Resolution info | String |

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:
```bash
python main.py
```

The backend server will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend application will run on `http://localhost:3000`

## 📡 API Endpoints

### Core Endpoints

- `POST /upload` - Upload CSV files for processing
- `GET /filter-options/{cache_key}` - Get available filter options
- `POST /analytics/{cache_key}` - Get analytics and statistics  
- `POST /table/{cache_key}` - Get paginated table data
- `POST /timeline/{cache_key}` - Get timeline chart data
- `GET /health` - Health check endpoint

### Request/Response Examples

#### Upload CSV
```bash
curl -X POST "http://localhost:8000/upload" \
     -F "files=@alarm_data.csv"
```

#### Get Analytics
```bash
curl -X POST "http://localhost:8000/analytics/{cache_key}" \
     -H "Content-Type: application/json" \
     -d '{
       "date_from": "2024-01-01",
       "date_to": "2024-12-31",
       "categories": ["Safety Issue"]
     }'
```

## 🔍 Usage Guide

1. **Upload Data**: Click "Upload CSV File" and select your alarm chain pulling incidents CSV file
2. **Apply Filters**: Use the filter drawer to narrow down data by various criteria
3. **View Analytics**: Examine the statistics cards and charts for insights
4. **Browse Data**: Scroll through the detailed incident table with pagination
5. **Export/Analysis**: Use the filtered data for further analysis

## 🎯 Key Metrics Tracked

- **Total Incidents**: Overall count of alarm chain pulling incidents
- **Timeline Trends**: Monthly incident patterns  
- **Direction Analysis**: UP vs DOWN direction distribution
- **Category Breakdown**: Most common incident categories
- **Reason Analysis**: Top reasons for alarm chain pulling
- **Coach Type Impact**: Distribution across different coach types
- **Section Analysis**: Geographic distribution of incidents

## 🔧 Development

### Backend Development
- FastAPI with automatic OpenAPI documentation at `/docs`
- Pandas for efficient data processing
- File-based caching for performance
- Pydantic models for request/response validation

### Frontend Development  
- React with TypeScript for type safety
- Ant Design for consistent UI components
- Recharts for interactive data visualization
- Responsive design with mobile support

### Testing
```bash
# Backend tests
cd backend
pytest

# Frontend tests  
cd frontend
npm test
```

### Building for Production
```bash
# Backend (using uvicorn)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend
cd frontend
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`) 
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed description
3. Include sample data and steps to reproduce any bugs

---

**Note**: This dashboard is designed specifically for analyzing railway alarm chain pulling incidents and provides insights to help improve railway safety and operations.