import React, { useState, useCallback } from 'react';
import './App.css';

// --- Helper Components (defined within the same file) ---

const IconMedical = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M15.5 6.5A2.5 2.5 0 0 0 18 4a2.5 2.5 0 0 0-2.5-2.5A2.5 2.5 0 0 0 13 4a2.5 2.5 0 0 0 2.5 2.5z" />
        <path d="M12.5 13.5A2.5 2.5 0 0 0 15 11a2.5 2.5 0 0 0-2.5-2.5A2.5 2.5 0 0 0 10 11a2.5 2.5 0 0 0 2.5 2.5z" />
        <path d="m20.3 7.7-4.6 4.6" />
        <path d="m15.8 12.2-4.6 4.6" />
        <path d="M4 12.5a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 4 17.5a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 4 12.5z" />
        <path d="M19.5 17.5a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 19.5 22.5a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 19.5 17.5z" />
        <path d="M8.3 16.7 4 21" />
        <path d="m17 22 4-4.5" />
    </svg>
);

const IconUpload = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const Spinner = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
    </div>
);

const ErrorDisplay = ({ message }) => (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
    </div>
);

const ResultCard = ({ title, data }) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="space-y-2 text-sm">
            {Object.entries(data).map(([key, value]) => {
                // Handle arrays (e.g., a list of lab results)
                if (Array.isArray(value)) {
                    return (
                        <div key={key}>
                            <p className="font-medium text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</p>
                            <div className="pl-4 mt-1 space-y-2 border-l-2 border-slate-200">
                                {value.map((item, index) => (
                                    <div key={index} className="pl-2 pt-1 pb-1 border-l-2 border-slate-100 my-1">
                                        {typeof item === 'object' && item !== null ?
                                            Object.entries(item).map(([itemKey, itemValue]) => (
                                                <p key={itemKey} className="text-slate-500">
                                                    <span className="font-medium capitalize">{itemKey.replace(/([A-Z])/g, ' $1')}:</span> {String(itemValue) || 'N/A'}
                                                </p>
                                            )) :
                                            <p className="text-slate-500">{String(item) || 'N/A'}</p>
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }
                // Handle nested single objects
                if (typeof value === 'object' && value !== null) {
                    return (
                        <div key={key}>
                            <p className="font-medium text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</p>
                            <div className="pl-4 mt-1 space-y-1 border-l-2 border-slate-200">
                                {Object.entries(value).map(([subKey, subValue]) => (
                                    <p key={subKey} className="text-slate-500">
                                        <span className="font-medium capitalize">{subKey.replace(/([A-Z])/g, ' $1')}:</span> {String(subValue) || 'N/A'}
                                    </p>
                                ))}
                            </div>
                        </div>
                    );
                }
                // Handle simple key-value pairs
                return (
                    <p key={key} className="text-slate-500">
                        <span className="font-medium text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {String(value) || 'N/A'}
                    </p>
                );
            })}
        </div>
    </div>
);

const App = () => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setExtractedData(null);
            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const extractMedicalData = useCallback(async () => {
        if (!file) {
            setError('Please upload a medical report image first.');
            return;
        }

        setIsLoading(true);
        setError('');
        setExtractedData(null);

        try {
            const base64ImageData = await convertFileToBase64(file);
            const apiKey = "AIzaSyDeiKYLSgcFA8s0ecKFxhVJ9cmBKb-Dw0I"; // Canvas will provide key
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
            
            const payload = {
                contents: [
                    {
                        parts: [
                            { text: "Thoroughly analyze the provided medical report image. Extract all clinically relevant information and structure it into a clean, well-organized JSON object. Prioritize creating logical sections like 'patientInformation', 'vitalSigns', 'laboratoryResults', 'radiologyFindings', 'medications', and a 'clinicalSummary'. For list-like data such as lab results or medications, use arrays of objects. Ensure all values are correctly extracted and typed. If a section is not present in the report, omit it from the JSON." },
                            {
                                inlineData: {
                                    mimeType: file.type,
                                    data: base64ImageData
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                }
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content?.parts?.[0]?.text) {
                const jsonText = result.candidates[0].content.parts[0].text;
                const parsedJson = JSON.parse(jsonText);
                console.log('Extracted Data Object:', parsedJson); // Log the object to the console
                setExtractedData(parsedJson);
            } else {
                console.error("Unexpected API response structure:", result);
                throw new Error("Could not extract data. The AI response was empty or malformed.");
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'An unknown error occurred while processing the report.');
        } finally {
            setIsLoading(false);
        }
    }, [file]);

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800 min-w-screen">
            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-10">
                    <div className="flex justify-center items-center gap-3 text-indigo-600 mb-2">
                         <IconMedical />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Medical Report Analyzer</h1>
                    <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
                        Upload an image of a medical report, and our AI will instantly extract the key information into a structured format.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Upload & Preview */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-xl font-semibold mb-4 text-slate-800">1. Upload Report</h2>
                        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                                onChange={handleFileChange}
                                disabled={isLoading}
                            />
                            <label htmlFor="file-upload" className={`cursor-pointer inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <IconUpload />
                                {file ? 'Change Report' : 'Select a Report'}
                            </label>
                            <p className="text-xs text-slate-500 mt-3">PNG, JPG, or WEBP files supported.</p>
                        </div>

                        {previewUrl && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-slate-700 mb-2">Report Preview:</h3>
                                <div className="rounded-xl overflow-hidden border-2 border-slate-200 aspect-w-16 aspect-h-9">
                                    <img src={previewUrl} alt="Medical report preview" className="object-contain w-full h-full max-h-96 bg-slate-100" />
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-8">
                            <button
                                onClick={extractMedicalData}
                                disabled={!file || isLoading}
                                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center"
                            >
                                {isLoading ? 'Analyzing...' : '2. Extract Data'}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Results */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200">
                        <h2 className="text-xl font-semibold mb-4 text-slate-800">Extracted Information</h2>
                        <div className="h-full min-h-[300px]">
                            {isLoading && <Spinner />}
                            {error && <ErrorDisplay message={error} />}
                            {extractedData ? (
                                <div className="space-y-4">
                                    {Object.entries(extractedData).map(([key, value]) => {
                                        const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                                        
                                        // If the value is an array, render it within a ResultCard
                                        if (Array.isArray(value)) {
                                            return <ResultCard key={key} title={title} data={{ [key]: value }} />;
                                        } 
                                        // If the value is a non-array object, render it as a ResultCard
                                        else if (typeof value === 'object' && value !== null) {
                                            return <ResultCard key={key} title={title} data={value} />;
                                        } 
                                        // If the value is a string, display it directly
                                        else if (typeof value === 'string' && value.length > 0) {
                                            return (
                                                 <div key={key} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
                                                    <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
                                                    <p className="text-slate-600 text-sm whitespace-pre-wrap">{value}</p>
                                                 </div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            ) : (
                                !isLoading && !error && <div className="text-center text-slate-500 pt-16">
                                    <p>Your extracted data will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;



