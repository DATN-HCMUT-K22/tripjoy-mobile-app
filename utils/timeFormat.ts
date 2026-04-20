/**
 * Format timestamp as relative time for conversation list
 * Examples:
 * - Just now
 * - 5m ago
 * - 2h ago
 * - Yesterday
 * - Mon
 * - Apr 15
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const now = new Date();
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  // Invalid date
  if (isNaN(date.getTime())) {
    return '';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Just now (< 1 minute)
  if (diffSeconds < 60) {
    return 'Vừa xong';
  }

  // Minutes ago (< 60 minutes)
  if (diffMinutes < 60) {
    return `${diffMinutes}p`;
  }

  // Hours ago (< 24 hours)
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Hôm qua';
  }

  // This week (show day name)
  if (diffDays < 7) {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[date.getDay()];
  }

  // This year (show month + day)
  if (date.getFullYear() === now.getFullYear()) {
    const monthNames = [
      'Th1',
      'Th2',
      'Th3',
      'Th4',
      'Th5',
      'Th6',
      'Th7',
      'Th8',
      'Th9',
      'Th10',
      'Th11',
      'Th12',
    ];
    return `${date.getDate()} ${monthNames[date.getMonth()]}`;
  }

  // Older (show month + year)
  const monthNames = [
    'Th1',
    'Th2',
    'Th3',
    'Th4',
    'Th5',
    'Th6',
    'Th7',
    'Th8',
    'Th9',
    'Th10',
    'Th11',
    'Th12',
  ];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Format full date for message timestamps
 */
export function formatMessageTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (isNaN(date.getTime())) {
    return '';
  }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Format date separator for chat messages
 */
export function formatDateSeparator(timestamp: string | Date): string {
  const now = new Date();
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;

  if (isNaN(date.getTime())) {
    return '';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Today
  if (diffDays === 0) {
    return 'Hôm nay';
  }

  // Yesterday
  if (diffDays === 1) {
    return 'Hôm qua';
  }

  // This week
  if (diffDays < 7) {
    const dayNames = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy',
    ];
    return dayNames[date.getDay()];
  }

  // Full date
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}
