import User from "@/models/User";

class Room {
    id: string = '';
    title: string;
    host: string;
    guests: number;
    thumbnail: string;
    link: string;
    createdAt: number;
    updatedAt: number;
    version: string = '1.0.0';

    constructor(title: string, host: string, guests: number, thumbnail: string, link: string) {
        this.title = title;
        this.host = host;
        this.guests = guests;
        this.thumbnail = thumbnail;
        this.link = link;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }
}

export default Room;