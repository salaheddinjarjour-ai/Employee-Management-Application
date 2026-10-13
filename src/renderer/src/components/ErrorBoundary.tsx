import React from 'react'

type State = { hasError: boolean; error?: any }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }
  
  static getDerivedStateFromError(error: any) { 
    return { hasError: true, error } 
  }
  
  componentDidCatch(error: any, info: any) {
    console.error('[Renderer Error]', error, info)
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-right">
          <h1 className="text-xl font-semibold text-red-600 mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-gray-600 mb-4">يرجى إعادة المحاولة أو إبلاغ الدعم.</p>
          <pre className="text-xs bg-gray-50 p-3 rounded rtl">{String(this.state.error)}</pre>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            إعادة المحاولة
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
