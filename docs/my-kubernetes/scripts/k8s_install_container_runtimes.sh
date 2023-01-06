
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/containerd && cd /usr/nzhong/containerd

# Download the containerd package, from https://github.com/containerd/containerd/releases
wget https://github.com/containerd/containerd/releases/download/v1.6.12/containerd-1.6.12-linux-amd64.tar.gz
# Extract it under /usr/local
tar Cxzvf /usr/local containerd-1.6.12-linux-amd64.tar.gz

# Download containerd.service for systemd.
wget https://raw.githubusercontent.com/containerd/containerd/main/containerd.service
cp ./containerd.service /etc/systemd/system/containerd.service
systemctl daemon-reload
systemctl enable --now containerd

# Download runc package by specific version of "v1.1.4".
wget https://github.com/opencontainers/runc/releases/download/v1.1.4/runc.amd64
# Install
install -m 755 runc.amd64 /usr/local/sbin/runc

# Download cni package by specific version of "v1.1.1".
wget https://github.com/containernetworking/plugins/releases/download/v1.1.1/cni-plugins-linux-amd64-v1.1.1.tgz

# Make directory and extract package.
mkdir -p /opt/cni/bin
tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-v1.1.1.tgz

# Configure containerd with default options sample.
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
