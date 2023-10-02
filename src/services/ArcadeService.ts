import { open } from '@tauri-apps/api/shell';

import Controller from '@/modules/Helper';

import FirebaseService from '@/services/FirebaseService';

import Room from '@/models/Room';

/**
 * This service handles the listing of rooms on the arcade tab.
 */
class ArcadeService extends Controller {

    /**
     * The singleton instance.
     */
    public static instance: ArcadeService;
    
    /**
     * Rooms retrieved from the database.
     */
    public rooms: Room[] = [];

    /**
     * The last time the rooms were updated.
     */
    private _roomsLastUpdated: number = 0;

    /**
     * Get the singleton instance.
     */
    public static getInstance(): ArcadeService {

        if (!ArcadeService.instance) {
            ArcadeService.instance = new ArcadeService();
        }
        return ArcadeService.instance;
    }

    /**
     * This retrieves the rooms from the database. If the 
     * rooms were updated less than 1 minute ago, it will 
     * return the cached rooms.
     */
    public async getRooms() {

        // If the rooms were updated less than 1 minute ago, return the cached rooms.
        if (this._roomsLastUpdated > Date.now() - 60000) {
            return this.rooms;
        }

        // Get the rooms from the database.
        this.rooms = await FirebaseService.getRooms();

        // Update the last updated time.
        this._roomsLastUpdated = Date.now();

        // Return the rooms.
        return this.rooms;

    }

    /**
     * This parses a share link for the room and opens it in Parsec.
     * @param link The share link to parse.
     */
    public joinRoom(link: string) {

        // Double check this is a parsec.gg link.
        if (!link.includes('https://parsec.gg/')) {
            return;
        }
        
        // Remove domain from link.
        link = link.replace('https://parsec.gg/', '');

        // Remove the trailing slash.
        if (link.endsWith('/')) {
            link = link.substring(0, link.length - 1);
        }

        // Split the link into parts.
        const parts = link.split('/');

        // Open the link.
        open(`parsec://peer_id=${parts[1]}&host_secret=${parts[2]}&a=`);

    }
    
}

export default ArcadeService.getInstance();