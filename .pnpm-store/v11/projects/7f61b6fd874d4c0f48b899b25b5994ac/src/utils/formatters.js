export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (hours) => {
  if (hours === undefined || hours === null) return 'N/A';
  return `${hours} hrs`;
};

export const calculateResolutionRate = (resolved, total) => {
  if (!total) return '0%';
  return `${((resolved / total) * 100).toFixed(1)}%`;
};
