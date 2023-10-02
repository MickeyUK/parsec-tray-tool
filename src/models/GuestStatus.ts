import User from '@/models/User';

class GuestStatus {
    user: User;
    status: string;
    timestamp: number;

    constructor(user: User, status: string) {
        this.user = user;
        this.status = status;
        this.timestamp = Date.now();
    }
}

export default GuestStatus;