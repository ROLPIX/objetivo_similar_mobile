import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MAP_TYPES = {
    STANDARD: 'standard',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TERRAIN: 'terrain',
    NONE: 'none',
    MUTED_STANDARD: 'mutedStandard',
};

export const Marker = ({ coordinate, title, description, children }) => {
    return (
        <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }}>
            <View style={{ width: 20, height: 20, backgroundColor: 'red', borderRadius: 10, borderWidth: 2, borderColor: 'white' }} />
            {children}
        </View>
    );
};

export const Callout = ({ children }) => <View>{children}</View>;

const MapView = ({ initialRegion, region, children, style, ...props }) => {
    const currentRegion = region || initialRegion;
    const lat = currentRegion?.latitude || 0;
    const lng = currentRegion?.longitude || 0;

    // Using an iframe with OpenStreetMap for a simple web map
    return (
        <View style={[style, { overflow: 'hidden', backgroundColor: '#e2e8f0' }]}>
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
                style={{ border: 0 }}
            />
            <View style={{ position: 'absolute', pointerEvents: 'none', top: 0, left: 0, right: 0, bottom: 0 }}>
                {children}
            </View>
        </View>
    );
};

export default MapView;
export const AnimatedMapView = MapView;
