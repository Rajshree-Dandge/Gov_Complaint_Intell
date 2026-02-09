import React,{useState} from "react";

function SubmitGrievance (){
   const [des,setDes]=useState("");
   const [file,setFile]=useState(null);
   const [status,setStatus]=useState("");

   const handleUpload= async (e)=>{
        e.preventDefault();

        //create object  to send
        const formData=new FormData();
        formData.append("description",des);
        formData.append("file",file);

        try{
            setStatus("Uploading...");
            const res = await fetch("http://127.0.0.1:8000/submit-complaint", {
                method: "POST",
                body: formData
            });

            const response=await res.json();
            console.log("Result:",response);
            if(res.ok){
                setStatus("Success! complaint ID: "+response.message);
                setDes("");
                setFile(null);
            }


        }catch(err){
            console.log(err);
            setStatus("Backend is offline");
        }
   }

   return(
    <>
    <h2>Submit</h2>
    <form action="" onSubmit={handleUpload}>
        <label htmlFor="">Describe the issue:</label><br/>
        <textarea
         value={des}
         onChange={(e)=>setDes(e.target.value)}
         name="" id=""/><br/><br/>

        <label htmlFor="">Upload Photo</label><br/>
        <input
        onChange={(e)=>setFile(e.target.files[0])}
         type="file" /><br/><br/>

        <button type="submit">Submit</button>
    </form>
    <p>{status}</p>
    </>);
}
export default SubmitGrievance;