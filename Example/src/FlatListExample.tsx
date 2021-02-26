import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import {FlatList} from '@stream-io/flat-list-mvcp';

const AddMoreButton = ({onPress}) => (
  <TouchableOpacity onPress={onPress} style={styles.addMoreButton}>
    <Text style={styles.addMoreButtonText}>Add 5 items from this side</Text>
  </TouchableOpacity>
);

const ListItem = ({item}) => (
  <View style={styles.listItem}>
    <Text>List item: {item.value}</Text>
  </View>
);

// Generate unique key list item.
export const generateUniqueKey = () =>
  `_${Math.random().toString(36).substr(2, 9)}`;

export default () => {
  const [numbers, setNumbers] = useState(
    Array.from(Array(10).keys()).map((n) => ({
      id: generateUniqueKey(),
      value: n,
    })),
  );

  const addToEnd = () => {
    setNumbers((prev) => {
      const additionalNumbers = Array.from(Array(5).keys()).map((n) => ({
        id: generateUniqueKey(),
        value: n + prev[prev.length - 1].value + 1,
      }));

      return prev.concat(additionalNumbers);
    });
  };

  const addToStart = () => {
    setNumbers((prev) => {
      const additionalNumbers = Array.from(Array(5).keys())
        .map((n) => ({
          id: generateUniqueKey(),
          value: prev[0].value - n - 1,
        }))
        .reverse();

      return additionalNumbers.concat(prev);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AddMoreButton onPress={addToStart} />
      <View style={styles.listContainer}>
        <FlatList
          data={numbers}
          keyExtractor={(item) => item.id}
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
          }}
          renderItem={ListItem}
        />
      </View>
      <AddMoreButton onPress={addToEnd} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  addMoreButton: {
    padding: 8,
    backgroundColor: '#008CBA',
    alignItems: 'center',
  },
  addMoreButtonText: {
    color: 'white',
  },
  listContainer: {
    paddingVertical: 4,
    flexGrow: 1,
    flexShrink: 1,
    backgroundColor: 'black',
  },
  listItem: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    backgroundColor: 'white',
  },
});
