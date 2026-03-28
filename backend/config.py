from dotenv import load_dotenv
import os

# Force load from root folder
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print("DEBUG API KEY:", OPENAI_API_KEY)