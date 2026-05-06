import { useState } from 'react';

export function useAlert() {
    const [alert, setAlert] = useState(null);

    const showAlert = (message, type = 'info', duration = 3000) => {
        setAlert({ message, type, id: Date.now() });
        if (duration > 0) {
            setTimeout(() => setAlert(null), duration);
        }
    };

    const hideAlert = () => setAlert(null);

    return { alert, showAlert, hideAlert };
}

export function useConfirm() {
    const [confirm, setConfirm] = useState(null);

    const showConfirm = (message, onConfirm, onCancel) => {
        setConfirm({ message, onConfirm, onCancel, id: Date.now() });
    };

    const hideConfirm = () => setConfirm(null);

    return { confirm, showConfirm, hideConfirm };
}

export function ConfirmDialog({ message, onConfirm, onCancel, onClose }) {
    if (!message) return null;

    const handleConfirm = () => {
        onConfirm?.();
        onClose();
    };

    const handleCancel = () => {
        onCancel?.();
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleCancel}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9998,
                    animation: 'fadeIn 0.2s ease-out',
                }}
            >
                {/* Dialog */}
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '28px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                        animation: 'slideUp 0.3s ease-out',
                    }}
                >
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <span style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</span>
                        <p
                            style={{
                                margin: 0,
                                color: '#1f2937',
                                fontSize: '16px',
                                fontWeight: '500',
                                lineHeight: '1.6',
                            }}
                        >
                            {message}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleCancel}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                background: '#f3f4f6',
                                color: '#6b7280',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.target.style.background = '#e5e7eb';
                            }}
                            onMouseLeave={e => {
                                e.target.style.background = '#f3f4f6';
                            }}
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleConfirm}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => {
                                e.target.style.background = '#dc2626';
                            }}
                            onMouseLeave={e => {
                                e.target.style.background = '#ef4444';
                            }}
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
}

export default function StyledAlert({ message, type = 'info', onClose }) {
    if (!message) return null;

    const styles = {
        error: {
            bg: '#fee2e2',
            border: '#fecaca',
            text: '#991b1b',
            icon: '❌'
        },
        success: {
            bg: '#dcfce7',
            border: '#86efac',
            text: '#166534',
            icon: '✅'
        },
        info: {
            bg: '#eff6ff',
            border: '#bfdbfe',
            text: '#1e40af',
            icon: 'ℹ️'
        },
        warning: {
            bg: '#fef9c3',
            border: '#fcd34d',
            text: '#854d0e',
            icon: '⚠️'
        }
    };

    const style = styles[type] || styles.info;

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: style.bg,
                border: `2px solid ${style.border}`,
                borderRadius: '12px',
                padding: '16px 20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '400px',
                zIndex: 9999,
                animation: 'slideIn 0.3s ease-out',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '20px', flexShrink: 0 }}>{style.icon}</span>
                <div style={{ flex: 1 }}>
                    <p
                        style={{
                            margin: '0 0 4px 0',
                            color: style.text,
                            fontSize: '14px',
                            fontWeight: '600',
                            lineHeight: '1.4',
                        }}
                    >
                        {message}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: style.text,
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '0',
                        flexShrink: 0,
                    }}
                >
                    ✕
                </button>
            </div>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
