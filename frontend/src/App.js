import React from 'react';
import FileUploadForm from './components/FileUploadForm';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import the toastify CSS

function App() {
  return (
    <div className="App">
      <FileUploadForm />
      <ToastContainer autoClose={3000} /> {/* Auto close the toast after 3 seconds */}
    </div>
  );
}

export default App;
