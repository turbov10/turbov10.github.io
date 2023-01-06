
# Make folder to save installation packages and configuration files.
mkdir -p /usr/nzhong/k8s && cd /usr/nzhong/k8s

# Download the latest stable version.
#curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
# Get the latest stable version.
#curl -L -s https://dl.k8s.io/release/stable.txt
# Download the particular version of "v1.26.0".
curl -LO https://dl.k8s.io/release/v1.26.0/bin/linux/amd64/kubectl
# Install kubectl.
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify the installed version.
kubectl version --client


# Download the latest kubectl-convert package.
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl-convert"
# Install kubectl-convert.
sudo install -o root -g root -m 0755 kubectl-convert /usr/local/bin/kubectl-convert
# Verify the installed version.
kubectl convert --help
