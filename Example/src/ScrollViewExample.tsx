import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StyleSheet,
} from 'react-native';

import {ScrollView} from '@stream-io/flat-list-mvcp';

const AddMoreButton = ({onPress}) => (
  <TouchableOpacity onPress={onPress} style={styles.addMoreButton}>
    <Text style={styles.addMoreButtonText}>Add 5 items from this side</Text>
  </TouchableOpacity>
);

const ListItem = ({item}) => (
  <View style={styles.listItem}>
    <Text>List item: {item}</Text>
  </View>
);

export default () => {
  const [numbers, setNumbers] = useState(Array.from(Array(10).keys()));

  const addToEnd = () => {
    setNumbers((prev) => {
      const additionalNumbers = Array.from(Array(5).keys()).map(
        (n) => n + prev[prev.length - 1] + 1,
      );

      return prev.concat(additionalNumbers);
    });
  };

  const addToStart = () => {
    setNumbers((prev) => {
      const additionalNumbers = Array.from(Array(5).keys())
        .map((n) => prev[0] - n - 1)
        .reverse();

      return additionalNumbers.concat(prev);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AddMoreButton onPress={addToStart} />
      <View style={styles.listContainer}>
        <ScrollView
          maintainVisibleContentPosition={{
            autoscrollToTopThreshold: 20,
            minIndexForVisible: 0,
          }}>
          {numbers.map((n) => {
            return <ListItem item={n} key={n.toString()} />;
          })}
        </ScrollView>
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
