import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Container, Form, Button, ProgressBar } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FileUploadForm.css';

const FileUploadForm = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [siteName, setSiteName] = useState('');
  const [token, setToken] = useState('');
  const [version, setVersion] = useState('');
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const fileInputRef = useRef(null); // Ref to access the file input element

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleSiteNameChange = (e) => {
    setSiteName(e.target.value);
  };
  const handleTokenChange = (e) => {
    setToken(e.target.value);
  };

  const handleVersionChange = (e) => {
    // Validate version input to accept decimal values up to 2 digits
    const value = e.target.value;
    if (/^\d+(\.\d{0,2})?$/.test(value)) {
      setVersion(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('siteName', siteName);
    formData.append('version', version);
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('files', selectedFiles[i]);
    }

    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`, // Include the token as a Bearer authorization header
        },
        onUploadProgress: (progressEvent) => {
          // Calculate and update the progress percentage
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadPercentage(percentage);
        },
      });

      // File upload successful, display a success toast
      toast.success('Files uploaded successfully!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
      });

      // Clear input fields and reset progress bar on successful upload
      setSiteName('');
      setVersion('');
      setSelectedFiles([]);
      setUploadPercentage(0);

      // Reset the file input field value
      fileInputRef.current.value = '';
    } catch (error) {
      // Handle error, display error toast
      toast.error('Failed to upload files.', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
      });
    }
  };

  return (
    <Container>
      <h2>Anton Site Files Upload</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="token">
          <Form.Label>Token</Form.Label>
          <Form.Control
            type="text"
            value={token}
            onChange={handleTokenChange}
          />
        </Form.Group>
        <Form.Group controlId="siteName">
          <Form.Label>Site Name</Form.Label>
          <Form.Control
            type="text"
            value={siteName}
            onChange={handleSiteNameChange}
          />
        </Form.Group>
        <Form.Group controlId="version">
          <Form.Label>Version</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            value={version}
            onChange={handleVersionChange}
          />
        </Form.Group>
        <Form.Group controlId="files">
          <Form.Label>Select Files</Form.Label>
          <Form.Control
            type="file"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef} // Assign the ref to the file input
          />
        </Form.Group>
        <Button type="submit">Upload</Button>
      </Form>
      <ProgressBar now={uploadPercentage} label={`${uploadPercentage}%`} />
      <ToastContainer autoClose={3000} />
    </Container>
  );
};

export default FileUploadForm;
