import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { AuthScreen } from '../screens/AuthScreen';
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RoomBrowserScreen } from '../screens/RoomBrowserScreen';
import { LobbyScreen } from '../screens/LobbyScreen';
import { GameScreen } from '../screens/GameScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { RootStackParamList } from '../types/navigation';
import { selectAuth } from '../store/slices/authSlice';
import { refreshAuthToken } from '../store/slices/authSlice';
import { AppDispatch } from '../store/store';
import {View,StyleSheet} from 'react-native'

const Stack = createStackNavigator<RootStackParamList>();
const styles = StyleSheet.create({
  container: {
    height: '98%',
    backgroundColor: '#000'
  },
  subContainer: {
    flex: 3,
    justifyContent:'center',
    alignItems: 'center',
  }
})

export const AppNavigator: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, refreshToken } = useSelector(selectAuth);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // If we have tokens but not authenticated, try to refresh
        if (refreshToken && !isAuthenticated) {
          await dispatch(refreshAuthToken()).unwrap();
        }
      } catch (error) {
        console.log('Token refresh failed during initialization:', error);
        // Token refresh failed, user will need to login again
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [dispatch, refreshToken, isAuthenticated]);

  if (isInitializing) {
    // Return null to show the PersistGate loading screen
    return null;
  }

  return (
    <View>
      <View style={styles?.container}>
      <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "MainMenu" : "Auth"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          animationEnabled: true 
         }}
      >
        {isAuthenticated ? (
          // Authenticated screens
          <>
            <Stack.Screen name="MainMenu" component={MainMenuScreen} />
            <Stack.Screen name="Friends" component={FriendsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="RoomBrowser" component={RoomBrowserScreen} />
            <Stack.Screen name="Lobby" component={LobbyScreen} />
            <Stack.Screen name="Game" component={GameScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        ) : (
          // Unauthenticated screens
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </View>
    </View>
  );
};