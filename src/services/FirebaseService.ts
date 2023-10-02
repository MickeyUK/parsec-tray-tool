import { getClient, ResponseType, Body } from '@tauri-apps/api/http';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/functions';

import Room from '@/models/Room';
import User from '@/models/User';

import StoreService from './StoreService';

class FirebaseService {

    /**
     * The singleton instance.
     */
    private static _instance: FirebaseService;

    /**
     * Get the singleton instance.
     */
    public static getInstance(): FirebaseService {
        if (!FirebaseService._instance) {
            FirebaseService._instance = new FirebaseService();
        }
        return FirebaseService._instance;
    }

    /**
     * @description The firebase auth instance
     */
    private _auth: firebase.auth.Auth;

    /**
     * @description The firebase firestore instance
     */
    private _db: firebase.firestore.Firestore;

    /**
     * @description Delete all existing rooms on create (Testing only)
     * @default false
     */
    public _deleteAllOnCreate: boolean = true;

    /**
     * @description Constructor
     */
    constructor() {

        // Configure firebase from environment variables
        const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };
        firebase.initializeApp(firebaseConfig);

        // Emulators
        if (import.meta.env.VITE_FIREBASE_USE_EMULATORS === 'true') {
            firebase.auth().useEmulator("http://localhost:9099");
            firebase.firestore().useEmulator("localhost", 8080);
            firebase.functions().useEmulator("localhost", 5001);
        }

        this._auth = firebase.auth();
        this._db = firebase.firestore();

    }

    /**
     * @description Gets list of rooms from the database
     * @returns {Room[]} The list of rooms
     */
    public async getRooms(): Promise<Room[]> {
            
        // Get the rooms from the database
        const querySnapshot = await this._db.collection("rooms").get();

        // Convert the query snapshot to an array of rooms
        var rooms: Room[] = [];
        querySnapshot.forEach((doc) => {
            rooms.push(doc.data() as Room);
        });

        return rooms;
    
    }

    /**
     * @description Adds a room to the database.
     * @param room The room to add.
     */
    public async addRoom(room: Room) {

        // First delete any rooms that already exist by the same host
        const querySnapshot = await this._db.collection("rooms").where("host", "==", room.host).get();
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });

        // Add the room
        const roomRef = await this._db.collection("rooms").add(JSON.parse(JSON.stringify(room)));
        return roomRef.id;

    }

    /**
     * @description Updates a room in the database.
     * @param room The room to delete.
     */
    public async updateRoom(room: Room): Promise<void> {
        return this._db.collection("rooms").doc(room.id).update(JSON.parse(JSON.stringify(room)));
    }

    /**
     * @description Deletes a room from the database.
     * @param room The room to delete.
     */
    public async deleteRoom(room: Room): Promise<void> {
        return this._db.collection("rooms").doc(room.id).delete();
    }

    /**
     * @description Gets a game thumbnail from the cloud functions
     * @param {string} query The game name to search for
     * @returns {string} The game thumbnail url
     */
    async getThumbnail(query: string): Promise<string> {

        // Get the cloud function url
        var func = import.meta.env.VITE_FIREBASE_CLOUD_FUNCTIONS_URL + 'getThumbnail?gameName=' + query;

        // Create client and set headers
        const client = await getClient();

        // Get current user token
        var token = await this._auth.currentUser?.getIdToken();

        // Fetch set response type to json
        const response = await client.get(func, {
            timeout: 30,
            responseType: ResponseType.Text,
            // headers: {
            //     'Content-Type': 'application/json',
            //     'Authorization': 'Bearer ' + token
            // }
        }) as any;

        // Get the response body
        return response.data;

    }

}

export default FirebaseService.getInstance();