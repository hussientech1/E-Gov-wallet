-- Create default admin user for testing
-- This migration adds a default admin user to the admin_users table

-- Insert default admin user only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'admin') THEN
        INSERT INTO admin_users (username, password, full_name, is_active)
        VALUES ('admin', 'admin123', 'System Administrator', true);
        
        -- Log the creation
        INSERT INTO admin_logs (admin_username, action, ip_address)
        VALUES ('system', 'Created default admin user: admin', '127.0.0.1');
    END IF;
END $$;

-- Insert test admin user only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM admin_users WHERE username = 'testadmin') THEN
        INSERT INTO admin_users (username, password, full_name, is_active)
        VALUES ('testadmin', 'password123', 'Test Administrator', true);
        
        -- Log the creation
        INSERT INTO admin_logs (admin_username, action, ip_address)
        VALUES ('system', 'Created default admin user: testadmin', '127.0.0.1');
    END IF;
END $$;