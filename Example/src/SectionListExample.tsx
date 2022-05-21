import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  StyleSheet,
  SectionListData,
} from 'react-native';
import {SectionList} from '@stream-io/flat-list-mvcp';

type Item = {
  id: string;
  value: number;
};

const AddMoreButton = ({onPress}: {onPress: () => void}) => (
  <TouchableOpacity onPress={onPress} style={styles.addMoreButton}>
    <Text style={styles.addMoreButtonText}>Add 5 items from this side</Text>
  </TouchableOpacity>
);

const ListItem = ({item}: {item: Item}) => (
  <View style={styles.listItem}>
    <Text>List item: {item.value}</Text>
  </View>
);

const ListHeader = ({
  section,
}: {
  section: SectionListData<Item, {title: string}>;
}) => (
  <View style={styles.listTitle}>
    <Text>Title: {section.title}</Text>
  </View>
);

// Generate unique key list item.
export const generateUniqueKey = () =>
  `_${Math.random().toString(36).substr(2, 9)}`;

const SectionListExample = () => {
  const [sections, setSections] = useState([
    {
      title: 'Section 0 to 4',
      data: Array.from(Array(5).keys()).map((n) => ({
        id: generateUniqueKey(),
        value: n,
      })),
    },
    {
      title: 'Section 5 to 9',
      data: Array.from(Array(5).keys()).map((n) => ({
        id: generateUniqueKey(),
        value: n + 5,
      })),
    },
  ]);

  const addToEnd = () => {
    setSections((prev) => {
      const additionalSection = {
        title: `Section ${prev.length * 5} to ${prev.length * 5 + 4}`,
        data: Array.from(Array(5).keys()).map((n) => ({
          id: generateUniqueKey(),
          value: n + prev.length * 5,
        })),
      };

      return prev.concat(additionalSection);
    });
  };

  const addToStart = () => {
    setSections((prev) => {
      const additionalSection = {
        title: `Section ${prev[0].data[0].value - 5} to ${
          prev[0].data[0].value - 1
        }`,
        data: Array.from(Array(5).keys())
          .map((n) => ({
            id: generateUniqueKey(),
            value: prev[0].data[0].value - n - 1,
          }))
          .reverse(),
      };

      return [additionalSection].concat(prev);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AddMoreButton onPress={addToStart} />
      <View style={styles.listContainer}>
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          maintainVisibleContentPosition={{
            minIndexForVisible: 1,
          }}
          renderItem={ListItem}
          renderSectionHeader={ListHeader}
        />
      </View>
      <AddMoreButton onPress={addToEnd} />
    </SafeAreaView>
  );
};

export default SectionListExample;

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
  listTitle: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'grey',
  },
});
