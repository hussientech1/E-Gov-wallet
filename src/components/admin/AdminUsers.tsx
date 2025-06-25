import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchIcon, EditIcon, TrashIcon, LockIcon, BanIcon } from 'lucide-react';

interface User {
  national_number: string;
  full_name: string;
  phone_number: string;
  email?: string;
  profile_completed: boolean;
  role?: string;
  state?: string;
  gender?: string;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [editedUserData, setEditedUserData] = useState<Partial<User>>({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      if (error) throw error;

      setUsers(
        (data || []).map((u: any) => ({
          ...u,
          role: u.role || 'user',
        }))
      );
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = () => {
    if (!searchTerm) {
      fetchUsers();
      return;
    }
    
    setLoading(true);
    
    try {
      const filtered = users.filter(user => 
        user.national_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsers(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUserData({
      full_name: user.full_name,
      phone_number: user.phone_number,
      state: user.state,
      gender: user.gender,
      role: user.role
    });
    setShowEditDialog(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowResetPasswordDialog(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleSuspendUser = (user: User) => {
    setSelectedUser(user);
    setShowSuspendDialog(true);
  };

  const updateUser = async () => {
    if (!selectedUser || !editedUserData) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update(editedUserData)
        .eq('national_number', selectedUser.national_number);

      if (error) throw error;
      
      await logAdminAction(`Updated user ${selectedUser.national_number}`);
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      setShowEditDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async () => {
    if (!selectedUser) return;
    
    try {
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const { error } = await supabase
        .from('users')
        .update({ password_hash: tempPassword })
        .eq('national_number', selectedUser.national_number);

      if (error) throw error;
      
      await supabase
        .from('password_reset_tokens')
        .insert({
          national_number: selectedUser.national_number,
          token: Math.random().toString(36).slice(-16),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });
      
      await supabase
        .from('notifications')
        .insert({
          national_number: selectedUser.national_number,
          title: 'Password Reset',
          message: `Your password has been reset by an administrator. Use temporary password: ${tempPassword}`,
          status_type: 'warning'
        });
      
      await logAdminAction(`Reset password for user ${selectedUser.national_number}`);
      
      toast({
        title: "Password Reset",
        description: `Temporary password: ${tempPassword}`,
      });
      
      setShowResetPasswordDialog(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      if (selectedUser.national_number === currentUser?.nationalNumber) {
        toast({
          title: "Error",
          description: "You cannot delete your own account",
          variant: "destructive"
        });
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('national_number', selectedUser.national_number);

      if (error) throw error;
      
      await logAdminAction(`Deleted user ${selectedUser.national_number}`);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      setShowDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const suspendUser = async () => {
    if (!selectedUser) return;
    
    try {
      await supabase
        .from('notifications')
        .insert({
          national_number: selectedUser.national_number,
          title: 'Account Suspended',
          message: 'Your account has been suspended by an administrator.',
          status_type: 'error'
        });
      
      await logAdminAction(`Suspended user ${selectedUser.national_number}`);
      
      toast({
        title: "Success",
        description: "User suspended successfully",
      });
      
      setShowSuspendDialog(false);
    } catch (error) {
      console.error('Error suspending user:', error);
      toast({
        title: "Error",
        description: "Failed to suspend user",
        variant: "destructive"
      });
    }
  };

  const logAdminAction = async (action: string) => {
    try {
      await supabase.from('admin_logs').insert({
        admin_username: currentUser?.nationalNumber || 'unknown',
        action: action,
        ip_address: '127.0.0.1'
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">User Management</h2>
      
      <Tabs defaultValue="all-users" className="w-full">
        <TabsList>
          <TabsTrigger value="all-users">All Users</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="new-users">New Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all-users" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, national number, or phone"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        searchUsers();
                      }
                    }}
                  />
                </div>
                <Button onClick={searchUsers}>Search</Button>
                {searchTerm && (
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    fetchUsers();
                  }}>
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>List of all users</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>National Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading users...</TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">No users found</TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.national_number}>
                        <TableCell>{user.national_number}</TableCell>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>{user.role || 'User'}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${user.profile_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {user.profile_completed ? 'Active' : 'Incomplete Profile'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleResetPassword(user)}
                              title="Reset Password"
                            >
                              <LockIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-amber-600 hover:text-amber-700"
                              onClick={() => handleSuspendUser(user)}
                              title="Suspend User"
                            >
                              <BanIcon className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteUser(user)}
                              title="Delete User"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="admins" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>List of admin users</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>National Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">Loading admins...</TableCell>
                    </TableRow>
                  ) : (
                    users
                      .filter(user => user.role === 'admin')
                      .map((admin) => (
                        <TableRow key={admin.national_number}>
                          <TableCell>{admin.national_number}</TableCell>
                          <TableCell>{admin.full_name}</TableCell>
                          <TableCell>{admin.role}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(admin)}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="new-users" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableCaption>Recently registered users</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>National Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Profile Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading users...</TableCell>
                    </TableRow>
                  ) : (
                    users
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 10)
                      .map((user) => (
                        <TableRow key={user.national_number}>
                          <TableCell>{user.national_number}</TableCell>
                          <TableCell>{user.full_name}</TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                              ${user.profile_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {user.profile_completed ? 'Complete' : 'Incomplete'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="national-number">National Number (readonly)</Label>
                <Input 
                  id="national-number" 
                  value={selectedUser.national_number}
                  disabled
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="full-name">Full Name</Label>
                <Input 
                  id="full-name" 
                  value={editedUserData.full_name || ''}
                  onChange={(e) => setEditedUserData({...editedUserData, full_name: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={editedUserData.phone_number || ''}
                  onChange={(e) => setEditedUserData({...editedUserData, phone_number: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={editedUserData.role || ''}
                  onValueChange={(value) => setEditedUserData({...editedUserData, role: value})}
                >
                  <SelectTrigger id="role" className="mt-1">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  value={editedUserData.state || ''}
                  onChange={(e) => setEditedUserData({...editedUserData, state: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={editedUserData.gender || ''}
                  onValueChange={(value) => setEditedUserData({...editedUserData, gender: value})}
                >
                  <SelectTrigger id="gender" className="mt-1">
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={updateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <p className="py-4">
              Are you sure you want to reset the password for {selectedUser.full_name}?
              A temporary password will be generated and sent to the user.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>Cancel</Button>
            <Button onClick={resetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <p className="py-4">
              Are you sure you want to permanently delete {selectedUser.full_name}?
              This action cannot be undone.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteUser}>Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <p className="py-4">
              Are you sure you want to suspend {selectedUser.full_name}'s account?
              They will not be able to access the system until reinstated.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={suspendUser}>Suspend Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
