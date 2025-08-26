from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import io
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

app = FastAPI(title="Alarm Chain Pulling Analytics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

data_cache = {}

class FilterRequest(BaseModel):
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    train_numbers: Optional[List[str]] = None
    directions: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    reasons: Optional[List[str]] = None
    coach_types: Optional[List[str]] = None
    sections: Optional[List[str]] = None
    rpf_posts: Optional[List[str]] = None

class TableRequest(BaseModel):
    filters: FilterRequest
    page: int = 1
    page_size: int = 50

def process_alarm_data(df: pd.DataFrame) -> pd.DataFrame:
    """Process alarm chain pulling data with proper data types"""
    
    # Rename columns to standardized names
    column_mapping = {
        'DATE_M': 'date',
        'DAY NAME_F': 'day_name',
        'Train No': 'train_no',
        'Train From_To': 'train_from_to', 
        'Direction UP/Down': 'direction',
        'Daily/Non-daily': 'daily_type',
        'FROM': 'time_from',
        'TO': 'time_to',
        'Time Analysis': 'time_analysis',
        'Duration': 'duration',
        'POST_Names': 'post_names',
        'SOUTH/NORTH': 'south_north',
        'STN/SEC from': 'stn_sec_from',
        'Mid section': 'mid_section',
        'Broad section': 'broad_section',
        'K.M.No': 'km_no',
        'KM anlysis': 'km_analysis',
        'COACH': 'coach',
        'Coach No.': 'coach_no',
        'Reason': 'reason',
        'CATEGORY': 'category',
        'Remarks': 'remarks',
        'ESCORT': 'escort',
        'STATUS': 'status',
        'Punctuality loss': 'punctuality_loss',
        'Type of coach': 'type_of_coach',
        'Pantry car': 'pantry_car',
        'Other reasons': 'other_reasons',
        'Guard': 'guard',
        'LP/ALP': 'lp_alp',
        'TTE': 'tte',
        'Rectified by': 'rectified_by'
    }
    
    # Rename columns that exist in the dataframe
    df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})
    
    # Parse date column
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'], format='%d-%m-%Y', dayfirst=True, errors='coerce')
    
    # Convert categorical columns
    categorical_columns = [
        'direction', 'daily_type', 'south_north', 'category', 
        'reason', 'status', 'type_of_coach', 'escort'
    ]
    for col in categorical_columns:
        if col in df.columns:
            df[col] = df[col].astype('category')
    
    # Convert train_no to string for consistency
    if 'train_no' in df.columns:
        df['train_no'] = df['train_no'].astype(str)
    
    return df

def apply_filters(df: pd.DataFrame, filters: FilterRequest) -> pd.DataFrame:
    """Apply filters to the dataframe"""
    filtered_df = df.copy()
    
    # Date filters
    if filters.date_from:
        date_from = pd.to_datetime(filters.date_from)
        filtered_df = filtered_df[filtered_df['date'] >= date_from]
    
    if filters.date_to:
        date_to = pd.to_datetime(filters.date_to)
        filtered_df = filtered_df[filtered_df['date'] <= date_to]
    
    # Train number filter
    if filters.train_numbers:
        filtered_df = filtered_df[filtered_df['train_no'].isin(filters.train_numbers)]
    
    # Direction filter
    if filters.directions:
        filtered_df = filtered_df[filtered_df['direction'].isin(filters.directions)]
    
    # Category filter
    if filters.categories:
        filtered_df = filtered_df[filtered_df['category'].isin(filters.categories)]
    
    # Reason filter
    if filters.reasons:
        filtered_df = filtered_df[filtered_df['reason'].isin(filters.reasons)]
    
    # Coach type filter
    if filters.coach_types:
        filtered_df = filtered_df[filtered_df['type_of_coach'].isin(filters.coach_types)]
    
    # Section filter
    if filters.sections:
        filtered_df = filtered_df[filtered_df['broad_section'].isin(filters.sections)]
    
    # RPF Post filter
    if filters.rpf_posts:
        filtered_df = filtered_df[filtered_df['post_names'].isin(filters.rpf_posts)]
    
    return filtered_df

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload and process CSV files"""
    if len(files) > 3:
        raise HTTPException(status_code=400, detail="Maximum 3 files allowed")
    
    try:
        dfs = []
        file_contents = []
        
        for file in files:
            if not file.filename.endswith('.csv'):
                raise HTTPException(status_code=400, detail="Only CSV files are allowed")
            
            content = await file.read()
            file_contents.append(content)
            
            df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
            df = process_alarm_data(df)
            dfs.append(df)
        
        # Combine all dataframes
        combined_df = pd.concat(dfs, ignore_index=True)
        
        # Generate cache key from file contents
        combined_content = b''.join(file_contents)
        cache_key = hashlib.md5(combined_content).hexdigest()
        
        # Cache the processed data
        data_cache[cache_key] = {
            'data': combined_df,
            'upload_time': datetime.now(),
            'file_count': len(files)
        }
        
        return {"cache_key": cache_key, "total_records": len(combined_df)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.get("/filter-options/{cache_key}")
async def get_filter_options(cache_key: str):
    """Get available filter options for the dataset"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    
    options = {}
    
    # Date range
    if 'date' in df.columns:
        options['date_range'] = {
            'min': df['date'].min().strftime('%Y-%m-%d') if not df['date'].isna().all() else None,
            'max': df['date'].max().strftime('%Y-%m-%d') if not df['date'].isna().all() else None
        }
    
    # Categorical options
    categorical_fields = {
        'train_numbers': 'train_no',
        'directions': 'direction',
        'categories': 'category',
        'reasons': 'reason',
        'coach_types': 'type_of_coach',
        'sections': 'broad_section',
        'rpf_posts': 'post_names'  # Added RPF Post options
    }
    
    for option_key, column in categorical_fields.items():
        if column in df.columns:
            unique_values = df[column].dropna().unique().tolist()
            options[option_key] = sorted([str(v) for v in unique_values])
    
    return options

@app.post("/analytics/{cache_key}")
async def get_analytics(cache_key: str, filters: FilterRequest):
    """Get analytics and statistics for the filtered data"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    analytics = {
        'total_incidents': len(filtered_df),
        'date_range': {
            'from': filtered_df['date'].min().strftime('%Y-%m-%d') if not filtered_df.empty and 'date' in filtered_df.columns else None,
            'to': filtered_df['date'].max().strftime('%Y-%m-%d') if not filtered_df.empty and 'date' in filtered_df.columns else None
        }
    }
    
    if not filtered_df.empty:
        # Top categories
        if 'category' in filtered_df.columns:
            analytics['top_categories'] = filtered_df['category'].value_counts().head(5).to_dict()
        
        # Top reasons
        if 'reason' in filtered_df.columns:
            analytics['top_reasons'] = filtered_df['reason'].value_counts().head(5).to_dict()
        
        # Direction distribution
        if 'direction' in filtered_df.columns:
            analytics['direction_distribution'] = filtered_df['direction'].value_counts().to_dict()
        
        # Coach type distribution
        if 'type_of_coach' in filtered_df.columns:
            analytics['coach_type_distribution'] = filtered_df['type_of_coach'].value_counts().to_dict()
        
        # Monthly trend
        if 'date' in filtered_df.columns:
            monthly_data = filtered_df.groupby(filtered_df['date'].dt.to_period('M')).size()
            analytics['monthly_trend'] = {str(k): int(v) for k, v in monthly_data.to_dict().items()}
    
    return analytics

@app.post("/table/{cache_key}")
async def get_table_data(cache_key: str, request: TableRequest):
    """Get paginated table data"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, request.filters)
    
    total_records = len(filtered_df)
    
    # Pagination
    start_idx = (request.page - 1) * request.page_size
    end_idx = start_idx + request.page_size
    page_df = filtered_df.iloc[start_idx:end_idx]
    
    # Convert to records
    records = []
    for _, row in page_df.iterrows():
        record = {}
        for col in page_df.columns:
            value = row[col]
            if pd.isna(value):
                record[col] = None
            elif isinstance(value, pd.Timestamp):
                record[col] = value.strftime('%Y-%m-%d')
            else:
                record[col] = str(value)
        records.append(record)
    
    return {
        'data': records,
        'total': total_records,
        'page': request.page,
        'page_size': request.page_size,
        'total_pages': (total_records + request.page_size - 1) // request.page_size
    }

@app.post("/timeline/{cache_key}")
async def get_timeline_data(cache_key: str, filters: FilterRequest, granularity: str = "monthly"):
    """Get timeline data for charts"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    if filtered_df.empty or 'date' not in filtered_df.columns:
        return {'timeline': []}
    
    # Group by time period
    if granularity == "daily":
        grouped = filtered_df.groupby(filtered_df['date'].dt.date)
    elif granularity == "weekly":
        grouped = filtered_df.groupby(filtered_df['date'].dt.to_period('W'))
    else:  # monthly
        grouped = filtered_df.groupby(filtered_df['date'].dt.to_period('M'))
    
    timeline_data = []
    for period, group in grouped:
        timeline_data.append({
            'period': str(period),
            'count': len(group),
            'date': str(period)
        })
    
    return {'timeline': timeline_data}

@app.post("/train-incidents/{cache_key}")
async def get_train_incidents(cache_key: str, filters: FilterRequest, limit: int = 25):
    """Get train incidents table with customizable limit"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    if filtered_df.empty or 'train_no' not in filtered_df.columns:
        return {'trains': []}
    
    # Group by train and count incidents
    train_counts = filtered_df['train_no'].value_counts().head(limit)
    
    train_incidents = []
    for train_no, count in train_counts.items():
        train_incidents.append({
            'train_no': str(train_no),
            'incident_count': int(count)
        })
    
    return {'trains': train_incidents}

@app.post("/train-analytics/{cache_key}")
async def get_train_analytics(cache_key: str, filters: FilterRequest, train_no: Optional[str] = None, limit: int = 10):
    """Get detailed analytics for specific train or all trains"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    # Filter by specific train if provided
    if train_no:
        filtered_df = filtered_df[filtered_df['train_no'] == train_no]
    
    if filtered_df.empty:
        return {
            'sections': {},
            'coaches': {},
            'reasons': {},
            'time_analysis': {},
            'mid_sections': {}
        }
    
    analytics = {}
    
    # Sections analysis (STN/SEC from)
    if 'stn_sec_from' in filtered_df.columns:
        sections = filtered_df['stn_sec_from'].value_counts().head(limit)
        analytics['sections'] = {str(k): int(v) for k, v in sections.items()}
    
    # Coaches analysis (COACH)
    if 'coach' in filtered_df.columns:
        coaches = filtered_df['coach'].value_counts().head(limit)
        analytics['coaches'] = {str(k): int(v) for k, v in coaches.items()}
    
    # Reasons analysis
    if 'reason' in filtered_df.columns:
        reasons = filtered_df['reason'].value_counts().head(limit)
        analytics['reasons'] = {str(k): int(v) for k, v in reasons.items()}
    
    # Time analysis (limited to 12 slices)
    if 'time_analysis' in filtered_df.columns:
        time_data = filtered_df['time_analysis'].value_counts().head(12)
        analytics['time_analysis'] = {str(k): int(v) for k, v in time_data.items()}
    
    # Mid section analysis
    if 'mid_section' in filtered_df.columns:
        mid_sections = filtered_df['mid_section'].value_counts().head(limit)
        analytics['mid_sections'] = {str(k): int(v) for k, v in mid_sections.items()}
    
    return analytics

@app.post("/train-timeline/{cache_key}")
async def get_train_timeline(cache_key: str, filters: FilterRequest, train_no: Optional[str] = None, granularity: str = "monthly"):
    """Get timeline data for specific train or all trains"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    # Filter by specific train if provided
    if train_no:
        filtered_df = filtered_df[filtered_df['train_no'] == train_no]
        # For specific train, use weekly granularity by default
        if granularity == "monthly":
            granularity = "weekly"
    
    if filtered_df.empty or 'date' not in filtered_df.columns:
        return {'timeline': []}
    
    # Group by time period
    if granularity == "daily":
        grouped = filtered_df.groupby(filtered_df['date'].dt.date)
    elif granularity == "weekly":
        grouped = filtered_df.groupby(filtered_df['date'].dt.to_period('W'))
    else:  # monthly
        grouped = filtered_df.groupby(filtered_df['date'].dt.to_period('M'))
    
    timeline_data = []
    for period, group in grouped:
        timeline_data.append({
            'period': str(period),
            'count': len(group),
            'date': str(period)
        })
    
    return {'timeline': timeline_data}

@app.get("/train-search/{cache_key}")
async def search_trains(cache_key: str, query: str = ""):
    """Search for trains by number"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    
    if 'train_no' not in df.columns:
        return {'trains': []}
    
    # Get unique train numbers
    unique_trains = df['train_no'].dropna().unique().tolist()
    unique_trains = sorted([str(train) for train in unique_trains])
    
    # Filter by query if provided
    if query:
        filtered_trains = [train for train in unique_trains if query.lower() in train.lower()]
        return {'trains': filtered_trains[:20]}  # Limit to 20 results
    
    return {'trains': unique_trains}

@app.post("/kpi-data/{cache_key}")
async def get_kpi_data(cache_key: str, filters: FilterRequest):
    """Get KPI data including total incidents, daily average, and monthly trend sparkline"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    total_incidents = len(filtered_df)
    percentile = None
    
    # Calculate percentile only if a single train is selected
    if filters.train_numbers and len(filters.train_numbers) == 1 and 'train_no' in df.columns:
        all_train_counts = df.groupby('train_no').size()
        selected_train_count = total_incidents
        percentile = (all_train_counts < selected_train_count).sum() / len(all_train_counts) * 100
    
    # Daily average calculation
    daily_avg = 0
    if not filtered_df.empty and 'date' in filtered_df.columns:
        date_range = (filtered_df['date'].max() - filtered_df['date'].min()).days
        if date_range > 0:
            daily_avg = total_incidents / date_range
    
    # Monthly sparkline trend (last 12 months or available data)
    monthly_trend = []
    if not filtered_df.empty and 'date' in filtered_df.columns:
        monthly_data = filtered_df.groupby(filtered_df['date'].dt.to_period('M')).size()
        monthly_trend = [int(count) for count in monthly_data.tail(12).values]
    
    return {
        "total_incidents": total_incidents,
        "percentile": percentile,
        "daily_avg": round(daily_avg, 2),
        "monthly_trend": monthly_trend
    }

@app.post("/day-analysis/{cache_key}")
async def get_day_analysis(cache_key: str, filters: FilterRequest):
    """Get day-wise analysis of incidents"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    if filtered_df.empty or 'day_name' not in filtered_df.columns:
        return {'day_analysis': {}}
    
    day_counts = filtered_df['day_name'].value_counts()
    return {'day_analysis': {str(k): int(v) for k, v in day_counts.items()}}

@app.post("/train-list/{cache_key}")
async def get_train_list(cache_key: str, filters: FilterRequest, limit: int = 25):
    """Get top affected trains with incident counts"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    if filtered_df.empty or 'train_no' not in filtered_df.columns:
        return {'trains': []}
    
    # Get train counts
    train_counts = filtered_df['train_no'].value_counts().head(limit)
    
    # Format as list with additional details
    trains_data = []
    for train_no, count in train_counts.items():
        train_data = filtered_df[filtered_df['train_no'] == train_no].iloc[0]
        
        trains_data.append({
            'train_no': str(train_no),
            'incident_count': int(count),
            'train_from_to': str(train_data.get('train_from_to', '')),
            'direction': str(train_data.get('direction', '')),
            'daily_type': str(train_data.get('daily_type', ''))
        })
    
    return {'trains': trains_data}

@app.post("/export-data/{cache_key}")
async def export_data(cache_key: str, filters: FilterRequest, format: str = "csv"):
    """Export filtered data in specified format"""
    if cache_key not in data_cache:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_cache[cache_key]['data']
    filtered_df = apply_filters(df, filters)
    
    if format.lower() == "csv":
        from fastapi.responses import Response
        import io
        
        output = io.StringIO()
        filtered_df.to_csv(output, index=False)
        csv_data = output.getvalue()
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=alarm_chain_data.csv"}
        )
    elif format.lower() == "json":
        from fastapi.responses import JSONResponse
        
        # Convert dataframe to JSON-serializable format
        records = []
        for _, row in filtered_df.iterrows():
            record = {}
            for col in filtered_df.columns:
                value = row[col]
                if pd.isna(value):
                    record[col] = None
                elif isinstance(value, pd.Timestamp):
                    record[col] = value.strftime('%Y-%m-%d')
                else:
                    record[col] = str(value)
            records.append(record)
        
        return JSONResponse(content={"data": records, "total_records": len(records)})
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'json'")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "cache_entries": len(data_cache)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)