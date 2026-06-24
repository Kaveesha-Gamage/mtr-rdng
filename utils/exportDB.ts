import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export const exportDatabase = async () => {
  try {
    const dbPath =
      FileSystem.documentDirectory +
      'SQLite/bill.db';

    console.log('Checking:', dbPath);

    const info = await FileSystem.getInfoAsync(dbPath);

    console.log('DB Info:', info);

    if (!info.exists) {
      alert('Database file not found');
      return;
    }

    const available =
      await Sharing.isAvailableAsync();

    console.log('Sharing available:', available);

    if (!available) {
      alert('Sharing is not available');
      return;
    }

    await Sharing.shareAsync(dbPath);

    alert('Export opened');

  } catch (e) {
    console.log('EXPORT ERROR:', e);
    alert('Export failed');
  }
};