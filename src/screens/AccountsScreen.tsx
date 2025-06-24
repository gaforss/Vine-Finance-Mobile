import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  ToastAndroid,
  FlatList,
} from 'react-native';
import {apiService} from '../services/api';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types';
import PlaidLink, {LinkSuccess, LinkExit} from 'react-native-plaid-link-sdk';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

interface Account {
  _id: string;
  name: string;
  category: string;
  amount: number;
  institutionName?: string;
  mask?: string;
}

interface AccountSection {
  title: string;
  data: Account[];
}

// Mapping from backend category keys to friendly names and icons
const CATEGORY_META: Record<string, {title: string; icon: string}> = {
  bank: {title: 'Bank Accounts', icon: 'university'},
  credit: {title: 'Credit Cards', icon: 'credit-card'},
  loan: {title: 'Loans', icon: 'money-check-alt'},
  investment: {title: 'Investment Accounts', icon: 'chart-line'},
  retirement: {title: 'Retirement Accounts', icon: 'flag'},
  insurance: {title: 'Insurance Accounts', icon: 'shield-alt'},
  digital: {title: 'Digital/Crypto Accounts', icon: 'bitcoin'},
  misc: {title: 'Miscellaneous Accounts', icon: 'asterisk'},
};

// Add a mapping for category colors
const CATEGORY_COLORS: Record<string, string> = {
  bank: '#0070ba',
  credit: '#ffb300',
  loan: '#e57373',
  investment: '#4caf50',
  retirement: '#9575cd',
  insurance: '#00bcd4',
  digital: '#ff9800',
  misc: '#bdbdbd',
};

// Map backend keys to UI-friendly keys
const CATEGORY_KEY_MAP: Record<string, string> = {
  bankAccounts: 'bank',
  creditCards: 'credit',
  loans: 'loan',
  investments: 'investment',
  retirement: 'retirement',
  insurance: 'insurance',
  digital: 'digital',
  miscellaneous: 'misc',
};

// Add this mapping at the top of your file (after CATEGORY_KEY_MAP):
const MANUAL_CATEGORY_TO_BACKEND_KEY: Record<string, string> = {
  bank: 'bankAccounts',
  'credit card': 'creditCards',
  loan: 'loans',
  investment: 'investments',
  retirement: 'retirement',
  insurance: 'insurance',
  crypto: 'digital',
  misc: 'miscellaneous',
};

const MANUAL_ACCOUNT_CATEGORIES = [
  'bank',
  'credit card',
  'loan',
  'investment',
  'retirement',
  'insurance',
  'crypto',
  'misc',
];

// Temporary error boundary for debugging
class DebugErrorBoundary extends React.Component<
  any,
  {hasError: boolean; error: any}
> {
  constructor(props: any) {
    super(props);
    this.state = {hasError: false, error: null};
  }
  static getDerivedStateFromError(error: any) {
    return {hasError: true, error};
  }
  componentDidCatch(error: any, info: any) {
    console.error('AccountsScreen: ErrorBoundary caught error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#181f2a',
          }}>
          <Text style={{color: 'red'}}>
            Render error: {String(this.state.error)}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const AccountsScreen: React.FC = () => {
  const [sections, setSections] = useState<AccountSection[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('');
  const [manualBalance, setManualBalance] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  console.log('🏦 AccountsScreen: rendering');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      // Fetch both Plaid and manual accounts in parallel
      const [plaidRes, manualRes] = await Promise.all([
        apiService.getAccounts(),
        apiService.getManualAccounts(),
      ]);
      console.log(
        '🏦 AccountsScreen: getManualAccounts raw response:',
        manualRes,
      );
      // Start with Plaid data
      let data = plaidRes.success && plaidRes.data ? {...plaidRes.data} : {};
      // Merge manual accounts into the correct categories (using web mapping)
      if (manualRes.success && Array.isArray(manualRes.data)) {
        for (const acct of manualRes.data) {
          const backendKey =
            MANUAL_CATEGORY_TO_BACKEND_KEY[acct.category] || 'miscellaneous';
          if (!data[backendKey]) {data[backendKey] = [];}
          data[backendKey].push(acct);
        }
      }
      // Transform categorized object into sections array, mapping Plaid fields
      const newSections: AccountSection[] = Object.entries(data)
        .map(([category, accounts]) => {
          const mappedKey = CATEGORY_KEY_MAP[category] || category;
          if (!Array.isArray(accounts)) {
            console.warn(
              `AccountsScreen: accounts for category '${category}' is not an array`,
              accounts,
            );
            return null;
          }
          // Only include valid accounts (never null)
          const validAccounts = accounts
            .map((acct: any) => {
              if (!acct || typeof acct !== 'object') {
                console.warn('AccountsScreen: Skipping invalid account:', acct);
                return null;
              }
              const mapped: Account = {
                _id: acct.account_id || acct._id || acct.id || '',
                name: acct.name || acct.official_name || 'Unnamed',
                category: acct.category || mappedKey || '',
                amount:
                  acct.balances && typeof acct.balances.current === 'number'
                    ? acct.balances.current
                    : typeof acct.amount === 'number'
                    ? acct.amount
                    : 0,
                institutionName: acct.institutionName || '',
                mask: acct.mask || '',
              };
              return mapped;
            })
            .filter((a): a is Account => !!a && typeof a._id === 'string');
          return {
            title: String(mappedKey),
            data: validAccounts,
          };
        })
        .filter(
          (section): section is AccountSection =>
            !!section &&
            typeof section.title === 'string' &&
            Array.isArray(section.data),
        )
        .map(section => {
          const filtered = {
            ...section,
            data: Array.isArray(section.data)
              ? section.data.filter(
                  item =>
                    item &&
                    typeof item === 'object' &&
                    typeof item._id === 'string' &&
                    typeof item.amount === 'number',
                )
              : [],
          };
          return filtered;
        })
        .filter(section => section.data.length > 0);
      setSections(newSections);
      console.log(
        '🏦 AccountsScreen: setSections with',
        newSections.length,
        'sections',
        newSections,
      );
    } catch (err) {
      console.error('AccountsScreen: Failed to fetch accounts', err);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleDelete = async (accountId: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const response = await apiService.deleteManualAccount(accountId);
            if (response.success) {
              fetchAccounts();
            } else {
              Alert.alert(
                'Error',
                response.error || 'Failed to delete account',
              );
            }
          },
        }
      ],
    );
  };

  const handlePlaidLink = async () => {
    try {
      const response = await apiService.createPlaidLinkToken();
      if (response.success && response.data?.link_token) {
        setLinkToken(response.data.link_token);
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to get Plaid link token',
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to start Plaid Link');
    }
  };

  const handlePlaidSuccess = async (success: LinkSuccess) => {
    try {
      const institutionName =
        success.metadata.institution?.name || 'Unknown Institution';
      const response = await apiService.exchangePublicToken(
        success.publicToken,
        institutionName,
      );
      if (response.success) {
        ToastAndroid.show('Account linked successfully!', ToastAndroid.SHORT);
        fetchAccounts(); // Refresh the accounts list
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to exchange public token',
        );
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred during Plaid verification.');
    }
    setLinkToken(null);
  };

  const openManualModal = (account?: Account) => {
    if (account) {
      setEditAccountId(account._id);
      setManualName(account.name);
      setManualType(account.category);
      setManualBalance(account.amount.toString());
    } else {
      setEditAccountId(null);
      setManualName('');
      setManualType('');
      setManualBalance('');
    }
    setShowManualModal(true);
  };

  const handleManualAddOrEdit = async () => {
    if (!manualName || !manualType || !manualBalance) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setManualLoading(true);
    try {
      let response;
      if (editAccountId) {
        response = await apiService.updateAccount(editAccountId, {
          name: manualName,
          category: manualType,
          amount: parseFloat(manualBalance),
        });
      } else {
        response = await apiService.addManualAccount({
          name: manualName,
          category: manualType,
          amount: parseFloat(manualBalance),
        });
      }
      if (response.success) {
        setShowManualModal(false);
        setManualName('');
        setManualType('');
        setManualBalance('');
        setEditAccountId(null);
        fetchAccounts();
        ToastAndroid.show(
          editAccountId ? 'Account updated!' : 'Account added!',
          ToastAndroid.SHORT,
        );
      } else {
        console.log('Add/Edit Manual Account failed:', response);
        Alert.alert('Error', response.error || 'Failed to save account');
      }
    } catch (err) {
      console.log('Add/Edit Manual Account exception:', err);
      Alert.alert('Error', 'Failed to save account');
    }
    setManualLoading(false);
  };

  const totalBalance = sections
    .flatMap(section => section.data)
    .reduce(
      (sum, acct) => sum + (typeof acct.amount === 'number' ? acct.amount : 0),
      0,
    );

  // Add dynamic balance calculations
  const getBalance = (categoryKey: string) =>
    sections
      .filter(section => section.title === categoryKey)
      .flatMap(section => section.data)
      .reduce(
        (sum, acct) =>
          sum + (typeof acct.amount === 'number' ? acct.amount : 0),
        0,
      );

  const cashBalance = getBalance('bank');
  const investmentBalance = getBalance('investment');
  const realEstateBalance = getBalance('real estate');
  const retirementBalance = getBalance('retirement');
  const liabilitiesBalance = getBalance('loan') + getBalance('credit');
  const insuranceBalance = getBalance('insurance');
  const miscBalance = getBalance('misc');

  // Helper to render each account card in grid
  const renderAccountCard = ({item: account}: {item: Account}) => {
    const isPlaid =
      !!account.institutionName && account.institutionName !== 'Manual';
    const iconName = isPlaid ? 'link' : 'plus';
    return (
      <View style={{width: '100%', marginVertical: 10, marginHorizontal: 0}}>
        <View
          style={{
            backgroundColor: '#253047',
            borderRadius: 22,
            padding: 22,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 12,
            shadowOffset: {width: 0, height: 6},
            elevation: 4,
            minHeight: 200,
            justifyContent: 'space-between',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <FontAwesome5 name={iconName} size={26} color={'#0070ba'} />
            </View>
            <TouchableOpacity
              style={{padding: 4}}
              onPress={() => openManualModal(account)}>
              <FontAwesome5 name="ellipsis-v" size={22} color="#b0b8c1" />
            </TouchableOpacity>
          </View>
          <View style={{marginTop: 18}}>
            <Text
              style={{
                color: '#b0b8c1',
                fontSize: 15,
                fontWeight: '500',
                marginBottom: 2,
              }}>
              {String(account.institutionName || 'Manual Account')}
            </Text>
            <Text
              style={{
                color: '#fff',
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 16,
              }}>
              {String(account.name || '')}
            </Text>
            <Text
              style={{
                color: '#b0b8c1',
                fontSize: 15,
                fontWeight: '500',
                marginBottom: 2,
              }}>
              Available Balance
            </Text>
            <Text
              style={{
                color: '#fff',
                fontSize: 28,
                fontWeight: 'bold',
                marginBottom: 2,
              }}>
              {typeof account.amount === 'number'
                ? `$${account.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : '0.00'}
            </Text>
            {isPlaid && (
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: '#0070ba',
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  alignSelf: 'flex-start',
                }}
                onPress={() =>
                  navigation.navigate('Transactions', {
                    accountId: account._id,
                    accountName: account.name,
                  })
                }>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>
                  View Transactions
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <DebugErrorBoundary>
      <SafeAreaView style={{flex: 1, backgroundColor: '#181f2a'}}>
        <ScrollView contentContainerStyle={{paddingBottom: 120}}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#fff',
              marginTop: 18,
              marginLeft: 18,
              marginBottom: 8,
            }}>
            Balances
          </Text>
          {/* Balances summary as horizontal scrollable cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{marginBottom: 18}}
            contentContainerStyle={{paddingHorizontal: 16}}>
            <View style={styles.balanceCard}>
              <FontAwesome5 name="money-bill-wave" size={20} color="#0070ba" />
              <Text style={styles.balanceCardLabel}>Cash</Text>
              <Text
                style={
                  styles.balanceCardAmount
                }>{`$${cashBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <View style={styles.balanceCard}>
              <FontAwesome5 name="chart-line" size={20} color="#4caf50" />
              <Text style={styles.balanceCardLabel}>Investments</Text>
              <Text
                style={
                  styles.balanceCardAmount
                }>{`$${investmentBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <View style={styles.balanceCard}>
              <FontAwesome5 name="home" size={20} color="#ffb300" />
              <Text style={styles.balanceCardLabel}>Real Estate</Text>
              <Text
                style={
                  styles.balanceCardAmount
                }>{`$${realEstateBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <View style={styles.balanceCard}>
              <FontAwesome5 name="flag" size={20} color="#9575cd" />
              <Text style={styles.balanceCardLabel}>Retirement</Text>
              <Text
                style={
                  styles.balanceCardAmount
                }>{`$${retirementBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <View style={styles.balanceCard}>
              <FontAwesome5 name="university" size={20} color="#e57373" />
              <Text style={styles.balanceCardLabel}>Liabilities</Text>
              <Text
                style={
                  styles.balanceCardAmount
                }>{`$${liabilitiesBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <View style={styles.balanceCard}>
              <FontAwesome5 name="shield-alt" size={20} color="#00bcd4" />
              <Text style={styles.balanceCardLabel}>Insurance</Text>
              <Text
                style={
                  styles.balanceCardAmount
                }>{`$${insuranceBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
            <View style={styles.balanceCard}>
              <FontAwesome5 name="asterisk" size={20} color="#bdbdbd" />
              <Text style={styles.balanceCardLabel}>Misc</Text>
              <Text
                style={
                  styles.balanceCardAmount
                }>{`$${miscBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}</Text>
            </View>
          </ScrollView>
          <Text
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: '#fff',
              marginTop: 18,
              marginLeft: 18,
              marginBottom: 8,
            }}>
            Accounts
          </Text>
          {sections.map((section, sIdx) => (
            <View key={section.title || String(sIdx)} style={{marginBottom: 8}}>
              <View style={styles.sectionHeaderRow}>
                <FontAwesome5
                  name={
                    CATEGORY_META[section.title?.toLowerCase?.()]?.icon ||
                    'university'
                  }
                  size={18}
                  color={
                    CATEGORY_COLORS[section.title?.toLowerCase?.()] || '#0070ba'
                  }
                  style={{marginRight: 8}}
                />
                <Text style={styles.sectionHeader}>
                  {(
                    CATEGORY_META[section.title?.toLowerCase?.()]?.title ||
                    section.title ||
                    ''
                  ).toUpperCase()}
                </Text>
                <View style={styles.sectionDivider} />
              </View>
              <FlatList
                data={section.data}
                renderItem={renderAccountCard}
                keyExtractor={item => item._id || item.name}
                numColumns={1}
                scrollEnabled={false}
                contentContainerStyle={{paddingTop: 8, paddingBottom: 8}}
              />
            </View>
          ))}
        </ScrollView>
        {/* Sticky floating action bar */}
        <View style={styles.fabBar}>
          <TouchableOpacity style={styles.fabPrimary} onPress={handlePlaidLink}>
            <FontAwesome5
              name="lock"
              size={18}
              color="#fff"
              style={{marginRight: 8}}
            />
            <Text style={styles.fabPrimaryText}>Link Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fabSecondary}
            onPress={() => openManualModal()}>
            <FontAwesome5
              name="plus"
              size={18}
              color="#0070ba"
              style={{marginRight: 8}}
            />
            <Text style={styles.fabSecondaryText}>Add Manual</Text>
          </TouchableOpacity>
        </View>

        {linkToken && (
          <PlaidLink
            tokenConfig={{token: linkToken}}
            onSuccess={handlePlaidSuccess}
            onExit={(exit: LinkExit) => {
              console.log('Plaid Link exited:', exit);
              setLinkToken(null);
            }}></PlaidLink>
        )}

        {/* Bottom sheet for manual add/edit */}
        <Modal visible={showManualModal} animationType="slide" transparent>
          <View style={styles.bottomSheetOverlay}>
            <View style={styles.bottomSheet}>
              <Text style={styles.modalTitle}>
                {editAccountId ? 'Edit Account' : 'Add Account Manually'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Account Name (e.g., Savings)"
                placeholderTextColor="#888"
                value={manualName}
                onChangeText={setManualName}
              />

              <Text style={styles.modalLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{marginVertical: 10}}>
                {MANUAL_ACCOUNT_CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryPill,
                      manualType === cat && styles.categoryPillSelected,
                    ]}
                    onPress={() => setManualType(cat)}>
                    <Text
                      style={[
                        styles.categoryPillText,
                        manualType === cat && styles.categoryPillTextSelected,
                      ]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.modalInput}
                placeholder="Current Balance"
                placeholderTextColor="#888"
                value={manualBalance}
                onChangeText={setManualBalance}
                keyboardType="numeric"
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  marginTop: 16,
                }}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowManualModal(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalAddButton}
                  onPress={handleManualAddOrEdit}
                  disabled={manualLoading}>
                  <Text style={styles.modalAddText}>
                    {manualLoading
                      ? editAccountId
                        ? 'Saving...'
                        : 'Adding...'
                      : editAccountId
                      ? 'Save'
                      : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </DebugErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181f2a',
    padding: 16,
  },
  plaidCard: {
    backgroundColor: '#1a2233',
    borderRadius: 18,
    padding: 24,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  plaidTitle: {
    color: '#e6eaf0',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  plaidButton: {
    backgroundColor: '#23d160',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 18,
    marginTop: 4,
  },
  plaidButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  plaidIllustration: {
    width: 160,
    height: 120,
    backgroundColor: '#23395d',
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: '#222b3a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    color: '#e6eaf0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  accountCard: {
    backgroundColor: '#29344a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  accountIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInstitution: {
    color: '#b0b8c1',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  accountName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  accountLabel: {
    color: '#b0b8c1',
    fontSize: 13,
    marginTop: 2,
  },
  accountBalance: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#29344a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  balanceLabel: {
    color: '#e6eaf0',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  linkButton: {
    backgroundColor: '#23d160',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginRight: 8,
  },
  linkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  manualButton: {
    backgroundColor: '#23d160',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  manualButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
  },
  helperText: {
    color: '#b0b8c1',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#222b3a',
    padding: 24,
    borderRadius: 18,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#e6eaf0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#333f55',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#fff',
    fontSize: 16,
  },
  modalLabel: {
    color: '#b0b8c1',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: '#333f55',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  categoryPillSelected: {
    backgroundColor: '#0070ba',
  },
  categoryPillText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryPillTextSelected: {
    color: '#fff',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  modalCancelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  modalAddButton: {
    backgroundColor: '#23d160',
    borderRadius: 8,
    padding: 12,
  },
  modalAddText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  emptyText: {
    color: '#b0b8c1',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 16,
  },
  balanceCard: {
    backgroundColor: '#222b3a',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
  },
  balanceCardLabel: {
    color: '#e6eaf0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  balanceCardAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    color: '#e6eaf0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333f55',
  },
  accountTypePill: {
    backgroundColor: '#333f55',
    borderRadius: 12,
    padding: 4,
  },
  accountTypePillText: {
    color: '#e6eaf0',
    fontSize: 13,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  fabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#181f2a',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabPrimary: {
    backgroundColor: '#23d160',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabPrimaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  fabSecondary: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabSecondaryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: '#222b3a',
    padding: 24,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    width: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyHeadline: {
    color: '#e6eaf0',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptySubtext: {
    color: '#b0b8c1',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyCtaButton: {
    backgroundColor: '#23d160',
    borderRadius: 8,
    padding: 12,
  },
  emptyCtaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  proCard: {
    backgroundColor: '#232c3b',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#232c3b',
    flexDirection: 'row',
    alignItems: 'center',
  },
  proIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222b3a',
  },
  proAccountName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  proInstitution: {
    color: '#b0b8c1',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 10,
  },
  proTypePill: {
    backgroundColor: '#29344a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 2,
  },
  proTypePillText: {
    color: '#e6eaf0',
    fontSize: 12,
    fontWeight: 'bold',
  },
  proBalance: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
  proIconBtn: {
    backgroundColor: '#232c3b',
    borderRadius: 8,
    padding: 6,
    marginLeft: 0,
  },
  closeButton: {
    backgroundColor: '#ff5555',
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AccountsScreen;