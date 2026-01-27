export const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '8px 16px',
    textAlign: 'left' as const,
    fontSize: '0.75rem',
    fontWeight: 500,
    color: 'rgba(255, 255, 255, 0.4)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: '12px 16px',
    fontSize: '0.875rem',
    color: '#fff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
  },
  tr: {
    transition: 'background-color 0.2s',
  },
};
