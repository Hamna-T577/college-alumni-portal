from flask import Flask, request, jsonify
import joblib
import pandas as pd

app = Flask(__name__)

# Load Model
model = joblib.load("ai_models/job_recommendation_model.pkl")
jobs_df = pd.read_csv("data/jobs.csv")

@app.route('/')
def home():
    return "AI Job Recommendation API is Running!"

@app.route('/recommend_jobs', methods=['POST'])
def recommend_jobs():
    data = request.json
    user_id = data.get("user_id")

    # Predict job recommendations
    job_ids = jobs_df["job_id"].tolist()
    user_job_pairs = [[user_id, job_id] for job_id in job_ids]
    
    predictions = model.predict(user_job_pairs)
    recommended_jobs = [job_ids[i] for i in range(len(job_ids)) if predictions[i] == 1]

    # Fetch job details
    recommended_jobs_list = jobs_df[jobs_df["job_id"].isin(recommended_jobs)].to_dict(orient="records")
    
    return jsonify({"recommended_jobs": recommended_jobs_list})

if __name__ == '__main__':
    app.run(debug=True)
