import ReactGA from 'react-ga4';

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

interface TrackingEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
    [key: string]: any;
}

export const initGA = () => {
    // Only initialize if not already initialized
    if (typeof window !== 'undefined') {
        if (!MEASUREMENT_ID) {
            console.log('GA4: No Measurement ID found, skipping initialization.');
            return;
        }

        console.log('Comparing IDs:', MEASUREMENT_ID);
        ReactGA.initialize(MEASUREMENT_ID, {
            gtagOptions: {
                cookie_flags: 'SameSite=None;Secure',
                debug_mode: true
            }
        });
        console.log('GA4 Initialized with iframe settings');
    }
};

export const trackEvent = ({ category, action, label, value, ...rest }: TrackingEvent) => {
    if (typeof window !== 'undefined') {
        console.log(`GA4 Event: ${category} - ${action}`, { label, value, ...rest });
        ReactGA.event({
            category,
            action,
            label,
            value,
            ...rest
        });
    }
};

export const trackWidgetView = (variant: 'A' | 'B' | 'D', slug: string) => {
    trackEvent({
        category: 'Widget',
        action: 'View',
        label: `Variant ${variant} - ${slug}`,
        variant: variant,
        client_slug: slug
    });
};

export const trackWidgetOpen = (variant: 'A' | 'B' | 'D', slug: string) => {
    trackEvent({
        category: 'Widget',
        action: 'Open',
        label: `Variant ${variant} - ${slug}`,
        variant: variant,
        client_slug: slug
    });
};

export const trackWidgetClose = (variant: 'A' | 'B' | 'D', slug: string, durationSeconds?: number) => {
    trackEvent({
        category: 'Widget',
        action: 'Close',
        label: `Variant ${variant} - ${slug}`,
        variant: variant,
        client_slug: slug,
        ...(durationSeconds !== undefined && { duration_seconds: Math.round(durationSeconds) })
    });
};

export const trackSectionOpen = (sectionName: string, variant: 'A' | 'B' | 'D', slug: string) => {
    if (typeof window !== 'undefined') {
        window.parent.postMessage({
            type: 'TRUSTHIRE_SECTION_OPEN',
            section_name: sectionName,
            variant: variant,
            business_id: slug
        }, '*');
    }
};
