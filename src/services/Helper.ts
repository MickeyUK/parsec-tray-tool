class Helper {

    /**
     * Show a success toast message.
     * @param message The message to show.
     */
    public static toastSuccess(message: string): void {
        // @ts-ignore
        $.toast({
            heading: 'Success',
            text: message,
            showHideTransition: 'slide',
            icon: 'success',
            position: 'top-left'
        });
    }

    /**
     * Show an error toast message.
     * @param message The message to show.
     */
    public static toastError(message: string): void {
        // @ts-ignore
        $.toast({
            heading: 'Error',
            text: message,
            showHideTransition: 'slide',
            icon: 'error',
            position: 'top-left'
        });
    }

    /**
     * Show a warning toast message.
     * @param message The message to show.
     */
    public static toastWarning(message: string): void {
        // @ts-ignore
        $.toast({
            heading: 'Warning',
            text: message,
            showHideTransition: 'slide',
            icon: 'warning',
            position: 'top-left'
        });
    }

    /**
     * Show an info toast message.
     * @param message The message to show.
     */
    public static toastInfo(message: string): void {
        // @ts-ignore
        $.toast({
            heading: 'Info',
            text: message,
            showHideTransition: 'slide',
            icon: 'info',
            position: 'top-left'
        });
    }

    /**
     * Format a timestamp into a human-readable string.
     * @param timestamp The timestamp to format.
     */
    public static formatTimestamp(timestamp: number) {

        // Create a new date object
        const date = new Date(timestamp);

        // Is this today?
        const today = new Date();

        // Was this less than a minute ago?
        const diff = today.getTime() - date.getTime();
        if (diff < 60000) {
            return 'Just now';
        }

        // Was this less than an hour ago?
        if (diff < 3600000) {
            return `${Math.round(diff / 60000)} minutes ago`;
        }

        // Was this less than a day ago?
        if (diff < 86400000) {
            return `${Math.round(diff / 3600000)} hours ago`;
        }

        // Format to DD/MM/YYYY
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

    }

}

export default Helper;