import { useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { Upload, FileText, File, Check, X } from 'lucide-react'

const SyllabusImport = () => {
  const { id } = useParams()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [errors, setErrors] = useState([])
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      
      if (!validTypes.includes(selectedFile.type)) {
        setErrors(['Only PDF and DOCX files are supported'])
        return
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setErrors(['File size must be less than 10MB'])
        return
      }

      setFile(selectedFile)
      setErrors([])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setErrors([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`/api/courses/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setExtractedData(response.data.extracted_data)
      setProcessing(true)
    } catch (error) {
      setErrors(['Error uploading file: ' + (error.response?.data?.error || 'Unknown error')])
    } finally {
      setUploading(false)
    }
  }

  const handleConfirm = async () => {
    try {
      await axios.post(`/api/courses/${id}`, extractedData)
      setSuccess(true)
    } catch (error) {
      setErrors(['Error creating course: ' + (error.response?.data?.error || 'Unknown error')])
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Course Created Successfully!</h2>
          <p className="text-green-700 mb-6">
            Your syllabus has been imported and the course has been created.
          </p>
          <a
            href={`/courses/${id}`}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>View Course</span>
          </a>
        </div>
      </div>
    )
  }

  if (extractedData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Review Extracted Data</h1>
            <div className="text-sm text-gray-500">
              File: {file?.name}
            </div>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              {errors.map((error, index) => (
                <p key={index} className="text-red-700 text-sm mb-1">{error}</p>
              ))}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    value={extractedData.title}
                    onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics</h3>
              <div className="space-y-3">
                {extractedData.topics.map((topic, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={topic.title}
                      onChange={(e) => {
                        const updatedTopics = [...extractedData.topics]
                        updatedTopics[index].title = e.target.value
                        setExtractedData({ ...extractedData, topics: updatedTopics })
                      }}
                      className="input-field flex-1"
                      placeholder="Topic title"
                    />
                    <input
                      type="number"
                      value={topic.sessions}
                      onChange={(e) => {
                        const updatedTopics = [...extractedData.topics]
                        updatedTopics[index].sessions = parseInt(e.target.value)
                        setExtractedData({ ...extractedData, topics: updatedTopics })
                      }}
                      className="input-field w-24"
                      placeholder="Sessions"
                      min="1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedTopics = extractedData.topics.filter((_, i) => i !== index)
                        setExtractedData({ ...extractedData, topics: updatedTopics })
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignments</h3>
              <div className="space-y-3">
                {extractedData.assignments.map((assignment, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={assignment.title}
                      onChange={(e) => {
                        const updatedAssignments = [...extractedData.assignments]
                        updatedAssignments[index].title = e.target.value
                        setExtractedData({ ...extractedData, assignments: updatedAssignments })
                      }}
                      className="input-field flex-1"
                      placeholder="Assignment title"
                    />
                    <select
                      value={assignment.type}
                      onChange={(e) => {
                        const updatedAssignments = [...extractedData.assignments]
                        updatedAssignments[index].type = e.target.value
                        setExtractedData({ ...extractedData, assignments: updatedAssignments })
                      }}
                      className="input-field w-32"
                    >
                      <option value="homework">Homework</option>
                      <option value="exam">Exam</option>
                      <option value="project">Project</option>
                      <option value="quiz">Quiz</option>
                    </select>
                    <input
                      type="text"
                      value={assignment.due_date}
                      onChange={(e) => {
                        const updatedAssignments = [...extractedData.assignments]
                        updatedAssignments[index].due_date = e.target.value
                        setExtractedData({ ...extractedData, assignments: updatedAssignments })
                      }}
                      className="input-field w-40"
                      placeholder="Due date"
                    />
                    <input
                      type="number"
                      value={assignment.weight}
                      onChange={(e) => {
                        const updatedAssignments = [...extractedData.assignments]
                        updatedAssignments[index].weight = parseInt(e.target.value)
                        setExtractedData({ ...extractedData, assignments: updatedAssignments })
                      }}
                      className="input-field w-20"
                      placeholder="Weight"
                      min="0"
                      max="100"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updatedAssignments = extractedData.assignments.filter((_, i) => i !== index)
                        setExtractedData({ ...extractedData, assignments: updatedAssignments })
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button
              onClick={() => setExtractedData(null)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              className="btn-primary"
            >
              Confirm and Create Course
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Syllabus</h1>
          <p className="text-gray-600">Upload your syllabus to automatically extract course information</p>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            {errors.map((error, index) => (
              <p key={index} className="text-red-700 text-sm mb-1">{error}</p>
            ))}
          </div>
        )}

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors"
          onClick={() => document.getElementById('file-input').click()}
        >
          <Upload className="mx-auto mb-4 text-gray-400" size={32} />
          <p className="text-gray-600 mb-2">Drag and drop your syllabus here</p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <button className="btn-primary">
            Browse Files
          </button>
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {file && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <File className="text-blue-600" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null)
                  setErrors([])
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="btn-primary w-full flex justify-center space-x-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>Upload and Extract Data</span>
            </>
          )}
        </button>

        <div className="mt-8 text-sm text-gray-500 text-center">
          <p>Supported file formats: PDF, DOCX (Microsoft Word)</p>
          <p className="mt-1">Maximum file size: 10MB</p>
        </div>
      </div>
    </div>
  )
}

export default SyllabusImport
