import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
    async get<T>(key: string, fallback: T): Promise<T> {
        const raw = await AsyncStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    },
    set: (key: string, value: any) => AsyncStorage.setItem(key, JSON.stringify(value)),
    del: (key: string) => AsyncStorage.removeItem(key),
};
