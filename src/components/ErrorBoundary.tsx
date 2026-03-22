import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log to error tracking service in production (Sentry, etc.)
        if (process.env.NODE_ENV === 'production') {
            console.error('Application error occurred')
        } else {
            console.error('Error caught by boundary:', error, errorInfo)
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        background: 'linear-gradient(135deg, #000005 0%, #0a0a1a 100%)',
                        color: '#fff',
                        fontFamily: "'JetBrains Mono', monospace",
                        padding: '20px',
                        textAlign: 'center'
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: '2rem',
                                marginBottom: '1rem',
                                color: '#00ffff',
                                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
                            }}
                        >
                            System Error
                        </h1>
                        <p style={{ fontSize: '1rem', marginBottom: '2rem', opacity: 0.8 }}>
                            Something went wrong. Please refresh the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 24px',
                                fontSize: '1rem',
                                background: 'rgba(0, 255, 255, 0.1)',
                                border: '1px solid #00ffff',
                                color: '#00ffff',
                                cursor: 'pointer',
                                fontFamily: "'JetBrains Mono', monospace",
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)'
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            Reload Application
                        </button>
                        {process.env.NODE_ENV !== 'production' && this.state.error && (
                            <div
                                style={{
                                    marginTop: '2rem',
                                    padding: '1rem',
                                    background: 'rgba(255, 0, 0, 0.1)',
                                    border: '1px solid rgba(255, 0, 0, 0.3)',
                                    borderRadius: '4px',
                                    textAlign: 'left',
                                    maxWidth: '600px',
                                    margin: '2rem auto 0'
                                }}
                            >
                                <p style={{ fontSize: '0.875rem', color: '#ff6b6b' }}>
                                    <strong>Dev Mode Error:</strong>
                                </p>
                                <pre
                                    style={{
                                        fontSize: '0.75rem',
                                        overflow: 'auto',
                                        color: '#ffaaaa'
                                    }}
                                >
                                    {this.state.error.message}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
