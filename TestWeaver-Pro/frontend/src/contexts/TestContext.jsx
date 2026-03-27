import { createContext, useContext, useReducer } from 'react'
import axios from 'axios'

const TestContext = createContext()

const initialState = {
  tests: [],
  currentTest: null,
  loading: false,
  error: null,
  testResults: null
}

const testReducer = (state, action) => {
  switch (action.type) {
    case 'TEST_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'TEST_SUCCESS':
      return {
        ...state,
        currentTest: action.payload,
        loading: false,
        error: null
      }
    case 'TEST_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    case 'SET_TESTS':
      return {
        ...state,
        tests: action.payload
      }
    case 'SET_TEST_RESULTS':
      return {
        ...state,
        testResults: action.payload
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

export const TestProvider = ({ children }) => {
  const [state, dispatch] = useReducer(testReducer, initialState)

  const executeTest = async (userStory, url) => {
    dispatch({ type: 'TEST_START' })
    
    try {
      const response = await axios.post('/api/tests/execute', {
        userStory,
        url
      })
      
      dispatch({
        type: 'TEST_SUCCESS',
        payload: response.data
      })
      
      return { success: true, data: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Test execution failed'
      dispatch({ type: 'TEST_FAILURE', payload: message })
      return { success: false, error: message }
    }
  }

  const getTestResults = async (testId) => {
    try {
      const response = await axios.get(`/api/tests/${testId}`)
      dispatch({
        type: 'SET_TEST_RESULTS',
        payload: response.data
      })
      return { success: true, data: response.data }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch test results'
      dispatch({ type: 'TEST_FAILURE', payload: message })
      return { success: false, error: message }
    }
  }

  const getAllTests = async () => {
    try {
      const response = await axios.get('/api/tests')
      dispatch({
        type: 'SET_TESTS',
        payload: response.data.tests
      })
      return { success: true, data: response.data.tests }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch tests'
      dispatch({ type: 'TEST_FAILURE', payload: message })
      return { success: false, error: message }
    }
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    executeTest,
    getTestResults,
    getAllTests,
    clearError
  }

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  )
}

export const useTest = () => {
  const context = useContext(TestContext)
  if (!context) {
    throw new Error('useTest must be used within a TestProvider')
  }
  return context
}
