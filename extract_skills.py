import fitz  # PyMuPDF
import docx
import re
import nltk
from nltk.corpus import stopwords

# Download stopwords for text cleaning
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

# ✅ Predefined list of skills (Can be expanded)
SKILL_KEYWORDS = {
    "Machine Learning", "Deep Learning", "Data Science", "Python", "Java", "C++", 
    "SQL", "Django", "Flask", "NLP", "TensorFlow", "PyTorch", "JavaScript", "React", 
    "Node.js", "Frontend", "Backend", "AI", "Web Development", "Data Engineering"
}

# ✅ Function to extract text from PDF
def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with fitz.open(pdf_path) as doc:
            for page in doc:
                text += page.get_text("text") + " "
    except Exception as e:
        print(f"❌ Error extracting PDF text: {e}")
    return text

# ✅ Function to extract text from DOCX
def extract_text_from_docx(docx_path):
    text = ""
    try:
        doc = docx.Document(docx_path)
        for para in doc.paragraphs:
            text += para.text + " "
    except Exception as e:
        print(f"❌ Error extracting DOCX text: {e}")
    return text

# ✅ Function to clean and extract skills from text
def extract_skills_from_text(text):
    words = re.findall(r'\b[a-zA-Z-]+\b', text)  # Extract words only
    words = [word for word in words if word.lower() not in stop_words]  # Remove stopwords
    found_skills = {word for word in words if word in SKILL_KEYWORDS}
    return list(found_skills)

# ✅ Function to process resume and extract skills
def extract_skills(resume_path):
    text = ""
    if resume_path.endswith(".pdf"):
        text = extract_text_from_pdf(resume_path)
    elif resume_path.endswith(".docx"):
        text = extract_text_from_docx(resume_path)

    skills = extract_skills_from_text(text)
    return skills
