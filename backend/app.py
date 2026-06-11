from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader,TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_groq import ChatGroq
from fastapi import FastAPI,HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os


load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
data_path = "data/"

#load the documents (md files from local folder data)
def load_documents()->list:
  loader = DirectoryLoader(data_path,glob="*.md",loader_cls=TextLoader)
  documents = loader.load()  # loads WHOLE file as one Document object
  return documents

# split the loaded docs into chunks(pieces)
def split_documents(doc)->list:
  text_splitter = RecursiveCharacterTextSplitter(chunk_size = 500,chunk_overlap=50)
  split_doc = text_splitter.split_documents(doc)
  return split_doc

#map the chunks against list of numbers vectors -> embeddings
# vectors are stored in vectordatabase
def load_vectorstore(chunks):
  embeddings = HuggingFaceEmbeddings(model_name ="all-MiniLM-L6-v2")
  vectorstore = Chroma(persist_directory="db", embedding_function=embeddings)
  return vectorstore

#gives top 3 chunk with the most simiarilty in user prompt
def get_retriever(vectorstore)->list:
  retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
  return retriever

# creates an obj of ChatGroq the llm we are going to use
def get_llm()->ChatGroq:
  llm =   ChatGroq(model="llama-3.3-70b-versatile",api_key=groq_api_key)
  return llm



# its the retrievalqa obj which chains the chunks and the user prompt to pass it
#to groq's api
def create_chain(llm,retriever):
    prompt = ChatPromptTemplate.from_template("""
    Answer the question based on the context below:
    
    Context: {context}
    
    Question: {input}
    """)
    
    chain = (
        {"context": retriever, "input": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain

app = FastAPI()
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"]
)
class Question(BaseModel): # making class of Question with string data member
  qs:str

#Callin functions
doc = load_documents() # loading documents
chnks = split_documents(doc) #chunking documents
vctrs = load_vectorstore(chnks) # mapping chnks against vectors
retriever = get_retriever(vctrs) # retrieving required chunks that match the prompt
llm = get_llm() # creating llm obj
chain = create_chain(llm,retriever) #chainig prompt with top 3 vectors(chunks) retrieved
@app.post("/ask")  # sending post request 
def ask_question(body:Question):
  answer = chain.invoke(body.qs)
  if answer:
   return{"answer":answer}
  else:
    raise HTTPException(status_code=404,detail="Couldn't get response")
   
