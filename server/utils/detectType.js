function detectMessageType(text, msgType) {
  const t = (text || '').toLowerCase().trim();

  if (['report', 'summary', 'total', 'kitna', 'kitne'].some(k => t.includes(k))) {
    return 'report';
  }

  if (['help', 'madad', 'kaise'].some(k => t.includes(k))) {
    return 'help';
  }

  if (['delete', 'undo', 'cancel', 'hatao', 'remove'].some(k => t.includes(k))) {
    return 'delete';
  }

  if (msgType === 'image') return 'image';
  if (msgType === 'audio') return 'audio';
  if (t.length > 0) return 'text';

  return 'unknown';
}

module.exports = { detectMessageType };
