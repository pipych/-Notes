// Shape calculation (1:1 from Shape.kt and NoteItemView.kt in bars-android)
export function getGroupItemShapeStyle(index: number, totalInGroup: number): string {
  if (totalInGroup <= 1) {
    return 'rounded-[20px]';
  }
  if (index === 0) {
    return 'rounded-t-[20px] rounded-b-[6px]';
  }
  if (index === totalInGroup - 1) {
    return 'rounded-t-[6px] rounded-b-[20px]';
  }
  return 'rounded-[6px]';
}
